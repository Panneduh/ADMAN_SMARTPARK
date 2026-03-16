import argparse
import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Any, Tuple

import cv2
import numpy as np
from ultralytics import YOLO

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def find_latest_image(folder: Path) -> Path:
    if not folder.exists() or not folder.is_dir():
        raise FileNotFoundError(f"Folder not found: {folder.resolve()}")
    images = [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS]
    if not images:
        raise FileNotFoundError(f"No images found in {folder.resolve()}")
    images.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return images[0]


@dataclass
class Spot:
    spot_id: str
    spot_type: str
    polygon: np.ndarray  # (N,1,2)


def load_spots(spots_path: str) -> Tuple[List[Spot], float]:
    with open(spots_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    spots: List[Spot] = []
    for s in cfg["spots"]:
        poly = np.array(s["polygon"], dtype=np.int32).reshape((-1, 1, 2))
        spots.append(Spot(spot_id=s["id"], spot_type=s.get("type", "regular"), polygon=poly))

    conf = float(cfg.get("yolo_conf_threshold", 0.35))  # add this to spots.json if you want
    return spots, conf


def point_in_poly(px: int, py: int, polygon: np.ndarray) -> bool:
    # returns +1 inside, 0 on edge, -1 outside
    return cv2.pointPolygonTest(polygon, (float(px), float(py)), False) >= 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--spots", default="spots.json", help="spots.json path")
    ap.add_argument("--current_folder", default="current_lot", help="Folder with current lot images")
    ap.add_argument("--image", default="", help="Optional: specific image path (overrides folder latest)")
    ap.add_argument("--out", default="annotated_yolo.jpg", help="Annotated output image")
    ap.add_argument("--json_out", default="latest_result.json", help="Output JSON file")
    ap.add_argument("--model", default="yolov8n.pt", help="YOLO model file (ex: yolov8n.pt)")
    ap.add_argument("--conf", default=-1.0, type=float, help="Override confidence threshold (ex: 0.35)")
    args = ap.parse_args()

    if not Path(args.spots).exists():
        raise FileNotFoundError(f"spots.json not found: {Path(args.spots).resolve()}")

    spots, conf_from_json = load_spots(args.spots)
    conf_thres = args.conf if args.conf >= 0 else conf_from_json

    # pick current image
    if args.image.strip():
        img_path = Path(args.image.strip())
    else:
        img_path = find_latest_image(Path(args.current_folder))

    img = cv2.imread(str(img_path))
    if img is None:
        raise FileNotFoundError(f"Could not read image: {img_path.resolve()}")

    print(f"Using CURRENT image: {img_path.resolve()}")
    print(f"Using SPOTS file:    {Path(args.spots).resolve()}")
    print(f"YOLO model:          {args.model} (conf={conf_thres})")

    # Load YOLO
    model = YOLO(args.model)

    # Run detection
    # classes include: car, truck, bus, motorcycle (COCO names)
    results = model.predict(source=img, conf=conf_thres, verbose=False)

    # Extract boxes
    dets = []
    names = results[0].names  # class id -> name
    boxes = results[0].boxes

    for b in boxes:
        cls_id = int(b.cls.item())
        cls_name = names.get(cls_id, str(cls_id))
        if cls_name not in {"car", "truck", "bus", "motorcycle"}:
            continue

        x1, y1, x2, y2 = b.xyxy[0].tolist()
        conf = float(b.conf.item())
        cx = int((x1 + x2) / 2)
        cy = int((y1 + y2) / 2)

        dets.append({
            "class": cls_name,
            "conf": conf,
            "bbox": [int(x1), int(y1), int(x2), int(y2)],
            "center": [cx, cy],
        })

    # Decide occupancy per spot (center point inside polygon)
    occupied_spots = set()
    for d in dets:
        cx, cy = d["center"]
        for spot in spots:
            if point_in_poly(cx, cy, spot.polygon):
                occupied_spots.add(spot.spot_id)

    # Build output
    out = {
        "timestamp": time.time(),
        "image_used": str(img_path),
        "free_count": 0,
        "used_count": 0,
        "free_ids": [],
        "used_ids": [],
        "free_accessible_ids": [],
        "used_accessible_ids": [],
        "detections": dets,
    }

    overlay = img.copy()

    for spot in spots:
        occupied = spot.spot_id in occupied_spots
        if occupied:
            out["used_count"] += 1
            out["used_ids"].append(spot.spot_id)
            if spot.spot_type == "accessible":
                out["used_accessible_ids"].append(spot.spot_id)
            color = (0, 0, 255)  # red
        else:
            out["free_count"] += 1
            out["free_ids"].append(spot.spot_id)
            if spot.spot_type == "accessible":
                out["free_accessible_ids"].append(spot.spot_id)
            color = (255, 0, 0) if spot.spot_type == "accessible" else (0, 255, 0)  # blue/green

        cv2.polylines(overlay, [spot.polygon], True, color, 2)
        pts = spot.polygon.reshape(-1, 2)
        cx = int(np.mean(pts[:, 0]))
        cy = int(np.mean(pts[:, 1]))
        cv2.putText(overlay, spot.spot_id, (cx - 20, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    # Draw detections
    for d in dets:
        x1, y1, x2, y2 = d["bbox"]
        cx, cy = d["center"]
        cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 255, 255), 2)
        cv2.circle(overlay, (cx, cy), 4, (0, 255, 255), -1)
        cv2.putText(overlay, f"{d['class']} {d['conf']:.2f}", (x1, max(15, y1 - 5)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)

    # Save files
    cv2.imwrite(args.out, overlay)
    with open(args.json_out, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)

    print("\nRESULTS")
    print(f"Free: {out['free_count']}, Used: {out['used_count']}")
    print(f"Free IDs: {out['free_ids']}")
    print(f"Free Accessible IDs: {out['free_accessible_ids']}")
    print(f"Saved annotated image: {Path(args.out).resolve()}")
    print(f"Saved result JSON:     {Path(args.json_out).resolve()}")


if __name__ == "__main__":
    main()