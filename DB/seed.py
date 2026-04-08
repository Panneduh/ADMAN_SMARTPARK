# Seeds the database with spot inventory and ensures every spot has a current state row.

from sqlalchemy.orm import Session  # Type for SQLAlchemy Session objects.
from DB.db import engine, Base, SessionLocal  # Engine/Base for creating tables + session factory.
from DB.models import Spot, SpotState  # Our ORM models.


def create_tables() -> None:
    # Create all tables if they do not exist yet.
    Base.metadata.create_all(bind=engine)


def seed_spots(session: Session) -> dict:
    # Seed 40 parking spots using labels that match the ML model output: PS1 ... PS40
    spot_defs = []

    # Create 40 spots with simple placeholder geometry.
    # You can refine cluster names / coordinates later if needed.
    for i in range(1, 41):
        spot_defs.append({
            "label": f"PS{i}",
            "cluster": "main_lot",
            "x1": 0.0,
            "y1": 0.0,
            "x2": 1.0,
            "y2": 1.0,
        })

    created_spots = 0
    created_states = 0

    for s in spot_defs:
        existing_spot = session.query(Spot).filter(Spot.label == s["label"]).one_or_none()

        if existing_spot is None:
            existing_spot = Spot(
                label=s["label"],
                cluster=s["cluster"],
                x1=s["x1"],
                y1=s["y1"],
                x2=s["x2"],
                y2=s["y2"],
            )
            session.add(existing_spot)
            session.flush()
            created_spots += 1

        existing_state = session.query(SpotState).filter(SpotState.spot_id == existing_spot.id).one_or_none()

        if existing_state is None:
            session.add(
                SpotState(
                    spot_id=existing_spot.id,
                    status="unknown",
                    confidence=None,
                )
            )
            created_states += 1

    session.commit()
    return {"created_spots": created_spots, "created_states": created_states}


def run_seed() -> dict:
    # Public helper to create tables and seed using a fresh session.
    create_tables()
    session = SessionLocal()
    try:
        return seed_spots(session)
    finally:
        session.close()