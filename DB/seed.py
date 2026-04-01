# seed.py
# Seeds the database with spot inventory and ensures every spot has a current state row.

from sqlalchemy.orm import Session  # Type for SQLAlchemy Session objects.
from DB.db import engine, Base, SessionLocal  # Engine/Base for creating tables + session factory.
from DB.models import Spot, SpotState  # Our ORM models.

def create_tables() -> None:
    # Create all tables if they do not exist yet.
    Base.metadata.create_all(bind=engine)

def seed_spots(session: Session) -> dict:
    # Example spot inventory. Replace these with your real labels/clusters/coords.
    # Each dict describes one physical spot in your lot.
    # ---- Spot layout generation (40 total) ----
    # Lower: 2 rows x 11 = 22
    # Upper: row 1 -> 10 (3 handicapped), row 2 -> 8 (2 handicapped) = 18
    spot_defs = []  # This list will hold dicts like {"label": "...", "cluster": "...", "x1":..., ...}

    def add_row(cluster: str, labels: list[str], y1: float, y2: float, left_margin: float = 0.02, right_margin: float = 0.02):
        """
        Creates evenly spaced bounding boxes across a row using normalized coordinates (0.0 to 1.0).

        cluster: which group/row this belongs to (used for filtering and UI layout)
        labels: list of spot labels in left-to-right order
        y1/y2: vertical bounds for the whole row
        left_margin/right_margin: keep boxes away from the edges of the image
        """
        usable_width = 1.0 - left_margin - right_margin          # How much horizontal space we can use (0..1)
        box_width = usable_width / len(labels)                   # Width of each spot box
        for i, label in enumerate(labels):                       # i = position in row, label = spot label
            x1 = left_margin + i * box_width                     # Left edge of this spot’s box
            x2 = left_margin + (i + 1) * box_width               # Right edge of this spot’s box
            spot_defs.append({                                   # Add one spot definition
                "label": label,
                "cluster": cluster,
                "is_handicapped": ("-H" in label),  # Simple heuristic: if label contains "-H", mark as handicapped.
                "x1": x1, "y1": y1,
                "x2": x2, "y2": y2
            })

    # ---- LOWER LOT (2 rows of 11) ----
    lower_row_1_labels = [f"L1-{i:02d}" for i in range(1, 12)]   # L1-01 ... L1-11
    lower_row_2_labels = [f"L2-{i:02d}" for i in range(1, 12)]   # L2-01 ... L2-11

    # Pick y-bands that make sense for your camera view (placeholders you’ll tune later)
    add_row("lower_row_1", lower_row_1_labels, y1=0.70, y2=0.78)
    add_row("lower_row_2", lower_row_2_labels, y1=0.80, y2=0.88)

    # ---- UPPER LOT (10 + 8) ----
    # Upper row 1: 10 total, first 3 are handicapped
    upper_row_1_labels = [f"U1-H{i:02d}" for i in range(1, 4)] + [f"U1-{i:02d}" for i in range(1, 8)]
    # That yields: U1-H01,U1-H02,U1-H03, U1-01..U1-07 (3 + 7 = 10)

    # Upper row 2: 8 total, first 2 are handicapped
    upper_row_2_labels = [f"U2-H{i:02d}" for i in range(1, 3)] + [f"U2-{i:02d}" for i in range(1, 7)]
    # That yields: U2-H01,U2-H02, U2-01..U2-06 (2 + 6 = 8)

    add_row("upper_row_1", upper_row_1_labels, y1=0.20, y2=0.28)
    add_row("upper_row_2", upper_row_2_labels, y1=0.10, y2=0.18)

    # Sanity check: total spot count should be 40
    assert len(spot_defs) == 40, f"Expected 40 spots, got {len(spot_defs)}"
    # ---- End spot layout generation ----


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
