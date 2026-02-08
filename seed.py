# seed.py
# Seeds the database with spot inventory and ensures every spot has a current state row.

from sqlalchemy.orm import Session  # Type for SQLAlchemy Session objects.
from db import engine, Base, SessionLocal  # Engine/Base for creating tables + session factory.
from models import Spot, SpotState  # Our ORM models.

def create_tables() -> None:
    # Create all tables if they do not exist yet.
    Base.metadata.create_all(bind=engine)

def seed_spots(session: Session) -> dict:
    # Example spot inventory. Replace these with your real labels/clusters/coords.
    # Each dict describes one physical spot in your lot.
    spot_defs = [
        {"label": "U1", "cluster": "upper_center", "x1": 0.10, "y1": 0.10, "x2": 0.20, "y2": 0.20},
        {"label": "U2", "cluster": "upper_center", "x1": 0.22, "y1": 0.10, "x2": 0.32, "y2": 0.20},
        {"label": "L1", "cluster": "lower_center", "x1": 0.10, "y1": 0.30, "x2": 0.20, "y2": 0.40},
        {"label": "L2", "cluster": "lower_center", "x1": 0.22, "y1": 0.30, "x2": 0.32, "y2": 0.40},
    ]

    created_spots = 0  # Track how many new Spot rows we create.
    created_states = 0  # Track how many new SpotState rows we create.

    # Loop through each spot definition.
    for s in spot_defs:
        # Look up the spot by label (label is unique).
        existing_spot = session.query(Spot).filter(Spot.label == s["label"]).one_or_none()

        # If the spot does not exist, create it.
        if existing_spot is None:
            existing_spot = Spot(
                label=s["label"],         # Set label.
                cluster=s["cluster"],     # Set cluster.
                x1=s["x1"], y1=s["y1"],   # Set bounding coords.
                x2=s["x2"], y2=s["y2"]
            )
            session.add(existing_spot)  # Add to session (not committed yet).
            session.flush()  # Flush so existing_spot gets an id without committing.
            created_spots += 1  # Increment spot counter.

        # Ensure there is a SpotState row for this spot (one-to-one current state).
        existing_state = session.query(SpotState).filter(SpotState.spot_id == existing_spot.id).one_or_none()

        # If no state row exists, create it with status="unknown".
        if existing_state is None:
            session.add(
                SpotState(
                    spot_id=existing_spot.id,  # Tie state to this spot.
                    status="unknown",          # Default initial state.
                    confidence=None,           # No confidence yet.
                )
            )
            created_states += 1  # Increment state counter.

    session.commit()  # Commit all changes (spots + states).
    return {"created_spots": created_spots, "created_states": created_states}

def run_seed() -> dict:
    # Public helper to create tables and seed using a fresh session.
    create_tables()  # Ensure tables exist.
    session = SessionLocal()  # Create a new DB session.
    try:
        # Seed inventory + ensure current state exists for each spot.
        return seed_spots(session)
    finally:
        session.close()  # Always close session.
