# main.py
# FastAPI app exposing endpoints to read and update current parking spot states.

from fastapi import FastAPI, Depends, HTTPException  # FastAPI core + dependency injection + errors.
from pydantic import BaseModel, Field  # Pydantic schemas for request/response validation.
from typing import Optional, List, Literal  # Type helpers for optional fields and restricted strings.
from sqlalchemy.orm import Session  # SQLAlchemy Session type.

from db import SessionLocal  # Session factory.
from models import Spot, SpotState, SpotEvent  # ORM models.
from seed import run_seed  # Seed helper.

# Define allowed statuses as a strict set of literals.
Status = Literal["empty", "occupied", "unknown"]

app = FastAPI(title="Parking Spot Backend")  # Create the FastAPI app instance.

def get_db():
    # Dependency that provides a DB session per request.
    db = SessionLocal()  # Create a new session.
    try:
        yield db  # Give it to the route handler.
    finally:
        db.close()  # Close session after request finishes.

# -----------------------
# Pydantic Schemas
# -----------------------

class SpotOut(BaseModel):
    # Response model for a spot + its current state.
    label: str  # Spot label like "U1".
    cluster: str  # Spot cluster/group.
    x1: float  # Bounding coords.
    y1: float
    x2: float
    y2: float
    status: Status  # Current status.
    confidence: Optional[float] = None  # Optional confidence.
    is_handicapped: bool  # Whether this spot is handicapped.

class UpdateSpotStateIn(BaseModel):
    # Request model for updating one spot.
    status: Status  # New status.
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)  # Optional confidence bounded 0..1.

class BulkUpdateItem(BaseModel):
    # One item in a bulk update payload.
    label: str  # Spot label to update.
    status: Status  # New status.
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)  # Optional confidence.

class BulkUpdateIn(BaseModel):
    # Bulk update payload.
    updates: List[BulkUpdateItem]  # List of updates.

# -----------------------
# Startup behavior
# -----------------------

@app.on_event("startup")
def on_startup():
    # On app startup, ensure tables exist and seed initial data.
    run_seed()  # Idempotent seed: safe to call repeatedly.

# -----------------------
# Routes
# -----------------------

@app.get("/health")
def health():
    # Simple health check endpoint.
    return {"ok": True}

@app.post("/seed")
def seed_now():
    # Manually re-run the seed process (safe/idempotent).
    return run_seed()

@app.get("/spots", response_model=List[SpotOut])
def list_spots(
    cluster: Optional[str] = None,  # Optional filter: cluster name.
    status: Optional[Status] = None,  # Optional filter: status.
    db: Session = Depends(get_db)  # Inject DB session.
):
    # Base query: join Spot with SpotState so we can return current status fields.
    q = db.query(Spot, SpotState).join(SpotState, SpotState.spot_id == Spot.id)

    # If cluster filter is provided, apply it.
    if cluster is not None:
        q = q.filter(Spot.cluster == cluster)

    # If status filter is provided, apply it.
    if status is not None:
        q = q.filter(SpotState.status == status)

    rows = q.all()  # Execute query.

    # Convert query rows into response objects.
    return [
        SpotOut(
            label=spot.label,               # Spot label.
            cluster=spot.cluster,           # Cluster.
            x1=spot.x1, y1=spot.y1,         # Geometry.
            x2=spot.x2, y2=spot.y2,
            status=state.status,            # Current state status.
            confidence=state.confidence,    # Current confidence.
            is_handicapped=spot.is_handicapped,  # Whether this spot is handicapped.
        )
        for (spot, state) in rows
    ]

@app.get("/spots/{label}", response_model=SpotOut)
def get_spot(label: str, db: Session = Depends(get_db)):
    # Fetch spot by label.
    spot = db.query(Spot).filter(Spot.label == label).one_or_none()

    # If spot not found, return 404.
    if spot is None:
        raise HTTPException(status_code=404, detail=f"Spot '{label}' not found")

    # Fetch the current state row (should exist if seeded correctly).
    state = db.query(SpotState).filter(SpotState.spot_id == spot.id).one_or_none()

    # If state missing, treat as server/data integrity issue.
    if state is None:
        raise HTTPException(status_code=500, detail=f"SpotState missing for spot '{label}'")

    # Return combined output.
    return SpotOut(
        label=spot.label,
        cluster=spot.cluster,
        x1=spot.x1, y1=spot.y1,
        x2=spot.x2, y2=spot.y2,
        status=state.status,
        confidence=state.confidence,
        is_handicapped=spot.is_handicapped,  # Whether this spot is handicapped.
    )

@app.put("/spots/{label}/state")
def update_spot_state(label: str, payload: UpdateSpotStateIn, db: Session = Depends(get_db)):
    # Fetch spot by label.
    spot = db.query(Spot).filter(Spot.label == label).one_or_none()

    # If not found, 404.
    if spot is None:
        raise HTTPException(status_code=404, detail=f"Spot '{label}' not found")

    # Fetch current state row.
    state = db.query(SpotState).filter(SpotState.spot_id == spot.id).one_or_none()

    # If missing, create it (extra safety).
    if state is None:
        state = SpotState(spot_id=spot.id, status="unknown", confidence=None)
        db.add(state)
        db.flush()

    # Detect whether status changed (so we can avoid logging no-op events if you want).
    status_changed = (state.status != payload.status)

    # Update the current state row.
    state.status = payload.status  # Set new status.
    state.confidence = payload.confidence  # Set confidence.

    # Always write an event on update; change to "if status_changed:" if you only want real flips logged.
    db.add(
        SpotEvent(
            spot_id=spot.id,                # Which spot changed.
            new_status=payload.status,      # New status recorded.
            confidence=payload.confidence,  # Confidence snapshot.
        )
    )

    db.commit()  # Commit transaction (state + event).

    return {
        "label": label,                   # Echo label.
        "updated": True,                  # Indicates update happened.
        "status_changed": status_changed  # Whether status actually changed.
    }

@app.put("/spots/state/bulk")
def bulk_update_states(payload: BulkUpdateIn, db: Session = Depends(get_db)):
    # Build a map label -> (spot, state) for all requested labels in one go.

    labels = [u.label for u in payload.updates]  # Extract labels from payload.

    # Fetch all matching spots.
    spots = db.query(Spot).filter(Spot.label.in_(labels)).all()

    # Map label to spot.
    spot_by_label = {s.label: s for s in spots}

    updated = 0  # Count of updates applied.
    missing = []  # Track labels that were not found.

    # Process each update item.
    for u in payload.updates:
        spot = spot_by_label.get(u.label)  # Get the spot for this label.

        # If spot missing, record it and continue.
        if spot is None:
            missing.append(u.label)
            continue

        # Load or create the current state row.
        state = db.query(SpotState).filter(SpotState.spot_id == spot.id).one_or_none()
        if state is None:
            state = SpotState(spot_id=spot.id, status="unknown", confidence=None)
            db.add(state)
            db.flush()

        # Apply state update.
        state.status = u.status
        state.confidence = u.confidence

        # Add an event row for this update.
        db.add(
            SpotEvent(
                spot_id=spot.id,
                new_status=u.status,
                confidence=u.confidence,
            )
        )

        updated += 1  # Increment update count.

    db.commit()  # Commit all updates/events.

    return {"updated": updated, "missing": missing}
