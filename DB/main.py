from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form  # FastAPI core + dependency injection + errors + file upload.
from pathlib import Path  # For file path manipulations.
from pydantic import BaseModel, Field  # Pydantic schemas for request/response validation.
from typing import Optional, List, Literal  # Type helpers for optional fields and restricted strings.
from sqlalchemy.orm import Session  # SQLAlchemy Session type.

from DB.db import SessionLocal  # Session factory.
from DB.models import Spot, SpotState, SpotEvent  # ORM models.
from DB.seed import run_seed  # Seed helper.

import shutil
import subprocess
import json
import time

BASE_DIR = Path(__file__).resolve().parent.parent

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


class UpdateSpotStateIn(BaseModel):
    # Request model for updating one spot.
    status: Status  # New status.
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)  # Optional confidence bounded 0..1.


class BulkUpdateItem(BaseModel):
    # One item in a bulk update payload.
    label: str  # Spot label to update.
    status: Status  # New status.
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)  # confidence.


class BulkUpdateIn(BaseModel):
    # Bulk update payload.
    updates: List[BulkUpdateItem]


# -----------------------
# Startup behavior
# -----------------------

@app.on_event("startup")
def on_startup():
    # Ensure tables exist and seed initial data.
    run_seed()


# -----------------------
# Shared Helpers
# -----------------------

def apply_bulk_updates(db: Session, updates: list[dict]) -> dict:
    # Reusable helper for applying many status updates at once.
    labels = [u["label"] for u in updates]

    # Fetch all matching spots in one query.
    spots = db.query(Spot).filter(Spot.label.in_(labels)).all()
    spot_by_label = {s.label: s for s in spots}

    updated = 0
    missing = []

    for u in updates:
        spot = spot_by_label.get(u["label"])

        if spot is None:
            missing.append(u["label"])
            continue

        state = db.query(SpotState).filter(SpotState.spot_id == spot.id).one_or_none()
        if state is None:
            state = SpotState(spot_id=spot.id, status="unknown", confidence=None)
            db.add(state)
            db.flush()

        state.status = u["status"]
        state.confidence = u.get("confidence")

        db.add(
            SpotEvent(
                spot_id=spot.id,
                new_status=u["status"],
                confidence=u.get("confidence"),
            )
        )

        updated += 1

    db.commit()
    return {"updated": updated, "missing": missing}


def clear_folder(folder: Path):
    # Delete all files in the folder so only the newest image remains.
    for f in folder.iterdir():
        if f.is_file():
            try:
                f.unlink()
            except Exception as e:
                print(f"Failed to delete {f}: {e}")


# -----------------------
# Routes
# -----------------------

@app.get("/health")
def health():
    # Health check endpoint.
    return {"ok": True}


@app.post("/seed")
def seed_now():
    # Manual re-run of seed.
    return run_seed()


@app.get("/spots", response_model=List[SpotOut])
def list_spots(
    cluster: Optional[str] = None,
    status: Optional[Status] = None,
    db: Session = Depends(get_db)
):
    # Join Spot with SpotState so we can return current status fields.
    q = db.query(Spot, SpotState).join(SpotState, SpotState.spot_id == Spot.id)

    # If cluster filter is provided.
    if cluster is not None:
        q = q.filter(Spot.cluster == cluster)

    # If status filter is provided.
    if status is not None:
        q = q.filter(SpotState.status == status)

    rows = q.all()  # Execute query.

    # Convert query rows into response objects.
    return [
        SpotOut(
            label=spot.label,
            cluster=spot.cluster,
            x1=spot.x1, y1=spot.y1,
            x2=spot.x2, y2=spot.y2,
            status=state.status,
            confidence=state.confidence,
        )
        for (spot, state) in rows
    ]


@app.get("/spots/{label}", response_model=SpotOut)
def get_spot(label: str, db: Session = Depends(get_db)):
    # Fetch spot by label.
    spot = db.query(Spot).filter(Spot.label == label).one_or_none()

    if spot is None:
        raise HTTPException(status_code=404, detail=f"Spot '{label}' not found")

    # Fetch the current state row.
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
    )


@app.put("/spots/{label}/state")
def update_spot_state(label: str, payload: UpdateSpotStateIn, db: Session = Depends(get_db)):
    # Fetch spot by label.
    spot = db.query(Spot).filter(Spot.label == label).one_or_none()

    if spot is None:
        raise HTTPException(status_code=404, detail=f"Spot '{label}' not found")

    # Fetch current state row.
    state = db.query(SpotState).filter(SpotState.spot_id == spot.id).one_or_none()

    # If missing, create it.
    if state is None:
        state = SpotState(spot_id=spot.id, status="unknown", confidence=None)
        db.add(state)
        db.flush()

    # Detect whether status changed for event logging.
    status_changed = (state.status != payload.status)

    # Update current state row.
    state.status = payload.status
    state.confidence = payload.confidence

    # Write an event on update.
    db.add(
        SpotEvent(
            spot_id=spot.id,
            new_status=payload.status,
            confidence=payload.confidence,
        )
    )

    db.commit()

    return {
        "label": label,
        "updated": True,
        "status_changed": status_changed
    }


@app.put("/spots/state/bulk")
def bulk_update_states(payload: BulkUpdateIn, db: Session = Depends(get_db)):
    updates = [
        {
            "label": u.label,
            "status": u.status,
            "confidence": u.confidence,
        }
        for u in payload.updates
    ]
    return apply_bulk_updates(db, updates)


# -----------------------
# Image Processing Endpoint
# -----------------------

IMAGE_BUFFER_DIR = Path("LM/current_lot")
IMAGE_BUFFER_DIR.mkdir(parents=True, exist_ok=True)

MODEL_SCRIPT = "LM/parking_detector.py"
SPOTS_PATH = "LM/spots.json"
LABEL_MAP_PATH = "LM/spot_label_map_example.json"
BLANK_FOLDER = "LM/blank_lot"
MODEL_WEIGHTS = "yolov8s.pt"


@app.post("/upload-lot-image")
async def upload_lot_image(
    file: UploadFile = File(...),
    camera_id: str = Form("unknown"),
    db: Session = Depends(get_db)
):
    # Save image.
    ext = Path(file.filename).suffix.lower() or ".jpg"
    filename = f"{camera_id}_{int(time.time())}{ext}"
    save_path = IMAGE_BUFFER_DIR / filename

    clear_folder(IMAGE_BUFFER_DIR)

    with save_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run model.
    result = subprocess.run(
        [
            "python",
            MODEL_SCRIPT,
            "--spots", SPOTS_PATH,
            "--current_folder", str(IMAGE_BUFFER_DIR),
            "--blank_folder", BLANK_FOLDER,
            "--model", MODEL_WEIGHTS,
            "--json_out", "LM/parking_status.json",
            "--out", "LM/annotated_colab_json.jpg",
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )

    # Read JSON + update DB.
    db_update_result = {"updated": 0, "missing": []}

    if result.returncode == 0:
        json_path = BASE_DIR / "LM" / "parking_status.json"

        with json_path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        updates = []

        # Support either key style: free_ids/used_ids or free/used.
        free_labels = data.get("free_ids", data.get("free", []))
        used_labels = data.get("used_ids", data.get("used", []))

        for label in free_labels:
            updates.append({
                "label": label,
                "status": "empty",
                "confidence": None
            })

        for label in used_labels:
            updates.append({
                "label": label,
                "status": "occupied",
                "confidence": None
            })

        db_update_result = apply_bulk_updates(db, updates)

    # Return response.
    return {
        "uploaded": True,
        "camera_id": camera_id,
        "saved_as": filename,
        "model_returncode": result.returncode,
        "model_stdout": result.stdout,
        "model_stderr": result.stderr,
        "db_updated": db_update_result["updated"],
        "db_missing": db_update_result["missing"],
    }