# FastAPI app exposing endpoints to read and update current parking spot states.

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form  # FastAPI core + dependency injection + errors + file upload.
from pathlib import Path  # For file path manipulations.
from pydantic import BaseModel, Field  # Pydantic schemas for request/response validation.
from typing import Optional, List, Literal  # Type helpers for optional fields and restricted strings.
from sqlalchemy.orm import Session  # SQLAlchemy Session type.
from datetime import datetime  # For timestamping images

from DB.db import SessionLocal  # Session factory.
from DB.models import Spot, SpotState, SpotEvent  # ORM models.
from DB.seed import run_seed  # Seed helper.

import shutil
import subprocess
import json

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
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)  # confidence.

class BulkUpdateIn(BaseModel):
    # Bulk update payload.
    updates: List[BulkUpdateItem]

# -----------------------
# Startup behavior
# -----------------------

@app.on_event("startup")
def on_startup():
    # ensure tables exist and seed initial data.
    run_seed()

# -----------------------
# Routes
# -----------------------

@app.get("/health")
def health():
    # health check enddpoint
    return {"ok": True}

@app.post("/seed")
def seed_now():
    # manual re-run of seed.
    return run_seed()

@app.get("/spots", response_model=List[SpotOut])
def list_spots(
    cluster: Optional[str] = None,
    status: Optional[Status] = None, 
    db: Session = Depends(get_db)  # Inject DB session
):
    # join Spot with SpotState so we can return current status fields (base query)
    q = db.query(Spot, SpotState).join(SpotState, SpotState.spot_id == Spot.id)

    # if cluster filter is provided
    if cluster is not None:
        q = q.filter(Spot.cluster == cluster)

    # if status filter is provided
    if status is not None:
        q = q.filter(SpotState.status == status)

    rows = q.all()  # execute query.

    # convert query rows into response objects.
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


    if spot is None:
        raise HTTPException(status_code=404, detail=f"Spot '{label}' not found")

    # fetch the current state row
    state = db.query(SpotState).filter(SpotState.spot_id == spot.id).one_or_none()

    # if state missing, treat as server/data integrity issue
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
        is_handicapped=spot.is_handicapped,
    )

@app.put("/spots/{label}/state")
def update_spot_state(label: str, payload: UpdateSpotStateIn, db: Session = Depends(get_db)):
    # fetch spot by label
    spot = db.query(Spot).filter(Spot.label == label).one_or_none()


    if spot is None:
        raise HTTPException(status_code=404, detail=f"Spot '{label}' not found")

    # fetch current state row
    state = db.query(SpotState).filter(SpotState.spot_id == spot.id).one_or_none()

    # If missing, create it
    if state is None:
        state = SpotState(spot_id=spot.id, status="unknown", confidence=None)
        db.add(state)
        db.flush()

    # detect whether status changed for event logging
    status_changed = (state.status != payload.status)

    # update current state row.
    state.status = payload.status  # Set new status.
    state.confidence = payload.confidence  # Set confidence.

    # write an event on update
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
    # build a map label (spot, state)

    labels = [u.label for u in payload.updates]  # Extract labels from payload.

    # fetch all matching spots
    spots = db.query(Spot).filter(Spot.label.in_(labels)).all()

    # map label to spot
    spot_by_label = {s.label: s for s in spots}

    updated = 0
    missing = [] 

    # process each update item
    for u in payload.updates:
        spot = spot_by_label.get(u.label)  # Get the spot for this label.

  
        if spot is None:
            missing.append(u.label)
            continue

        # Load or create current state row
        state = db.query(SpotState).filter(SpotState.spot_id == spot.id).one_or_none()
        if state is None:
            state = SpotState(spot_id=spot.id, status="unknown", confidence=None)
            db.add(state)
            db.flush()

        # state update
        state.status = u.status
        state.confidence = u.confidence


        db.add(
            SpotEvent(
                spot_id=spot.id,
                new_status=u.status,
                confidence=u.confidence,
            )
        )

        updated += 1

    db.commit()

    return {"updated": updated, "missing": missing}

# -----------------------
# Image Processing Endpoint
# -----------------------

# only store the latest 3 images

IMAGE_BUFFER_DIR = Path("LM/current_lot")
IMAGE_BUFFER_DIR.mkdir(parents=True, exist_ok=True)

MODEL_SCRIPT = "LM/parking_detector_colab_json.py"
SPOTS_PATH = "LM/spots.json"
LABEL_MAP_PATH = "LM/spot_label_map_example.json"
BLANK_FOLDER = "LM/blank_lot"
MODEL_WEIGHTS = "yolov8s.pt"

def keep_latest_images(folder: Path, keep: int = 3) -> None:
    image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
    files = [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in image_exts]

    files.sort(key=lambda p: p.stat().st_mtime, reverse=True)

    for old_file in files[keep:]:
        old_file.unlink(missing_ok=True)


# listening device route
@app.post("/upload-lot-image")
async def upload_lot_image(
    file: UploadFile = File(...),
    camera_id: str = Form("unknown")
):
    ext = Path(file.filename).suffix.lower() or ".jpg"
    filename = f"{camera_id}_{int(time.time())}{ext}"
    save_path = IMAGE_BUFFER_DIR / filename

    with save_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    keep_latest_images(IMAGE_BUFFER_DIR, keep=3)

    result = subprocess.run(
        [
            "python",
            MODEL_SCRIPT,
            "--spots", SPOTS_PATH,
            "--label_map", LABEL_MAP_PATH,
            "--current_folder", str(IMAGE_BUFFER_DIR),
            "--blank_folder", BLANK_FOLDER,
            "--model", MODEL_WEIGHTS,
            "--json_out", "LM/parking_status.json",
            "--out", "LM/annotated_colab_json.jpg",
        ],
        capture_output=True,
        text=True
    )

    return {
        "uploaded": True,
        "camera_id": camera_id,
        "saved_as": filename,
        "model_returncode": result.returncode,
        "model_stdout": result.stdout,
        "model_stderr": result.stderr,
    }