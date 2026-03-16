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

def spots_roi(spots, w, h, margin=20):
    xs, ys = [], []
    for s in spots:
        pts = s.polygon.reshape(-1, 2)
        xs.extend(pts[:, 0].tolist())
        ys.extend(pts[:, 1].tolist())
    x1 = max(0, int(min(xs) - margin))
    y1 = max(0, int(min(ys) - margin))
    x2 = min(w, int(max(xs) + margin))
    y2 = min(h, int(max(ys) + margin))
    return x1, y1, x2, y2


def scale_bboxes(dets, sx, sy):
    # if we scale ROI up before YOLO, we scale boxes back down
    for d in dets:
        x1, y1, x2, y2 = d["bbox"]
        d["bbox"] = [int(x1 / sx), int(y1 / sy), int(x2 / sx), int(y2 / sy)]
    return dets

@dataclass
class Spot:
    spot_id: str
    spot_type: str  # "regular" or "accessible"
    polygon: np.ndarray  # (N, 1, 2) int32


def load_spots(spots_path: str) -> Tuple[List[Spot], float, float]:
    """
    Returns:
      spots
      yolo_conf_threshold
      overlap_threshold (how much of the spot must be covered to count as occupied)
    """
    with open(spots_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    spots: List[Spot] = []
    for s in cfg["spots"]:
        poly = np.array(s["polygon"], dtype=np.int32).reshape((-1, 1, 2))
        spots.append(Spot(spot_id=s["id"], spot_type=s.get("type", "regular"), polygon=poly))

    yolo_conf = float(cfg.get("yolo_conf_threshold", 0.35))
    overlap_th = float(cfg.get("overlap_threshold", 0.12))  # 12% of spot area overlapped by a car box
    return spots, yolo_conf, overlap_th


def make_polygon_mask(shape_hw: Tuple[int, int], polygon: np.ndarray) -> np.ndarray:
    mask = np.zeros(shape_hw, dtype=np.uint8)
    cv2.fillPoly(mask, [polygon], 255)
    return mask


def bbox_mask(shape_hw: Tuple[int, int], x1: int, y1: int, x2: int, y2: int) -> np.ndarray:
    mask = np.zeros(shape_hw, dtype=np.uint8)
    x1 = max(0, min(x1, shape_hw[1] - 1))
    x2 = max(0, min(x2, shape_hw[1] - 1))
    y1 = max(0, min(y1, shape_hw[0] - 1))
    y2 = max(0, min(y2, shape_hw[0] - 1))
    cv2.rectangle(mask, (x1, y1), (x2, y2), 255, thickness=-1)
    return mask


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--spots", default="spots.json", help="spots.json path")
    ap.add_argument("--current_folder", default="current_lot", help="Folder with current lot images")
    ap.add_argument("--blank_folder", default="blank_lot", help="Folder with blank-lot reference images")

    ap.add_argument("--image", default="", help="Optional: specific current image path")
    ap.add_argument("--blank", default="", help="Optional: specific blank reference image path")

    ap.add_argument("--model", default="yolov8n.pt", help="YOLO model (ex: yolov8n.pt)")
    ap.add_argument("--conf", default=-1.0, type=float, help="Override YOLO confidence threshold (ex: 0.35)")

    ap.add_argument("--out", default="annotated_yolo.jpg", help="Annotated output image")
    ap.add_argument("--json_out", default="latest_result.json", help="Output JSON file")
    args = ap.parse_args()

    # --- choose files ---
    spots_path = Path(args.spots)
    if not spots_path.exists():
        raise FileNotFoundError(f"spots.json not found: {spots_path.resolve()}")

    # current
    if args.image.strip():
        cur_path = Path(args.image.strip())
    else:
        cur_path = find_latest_image(Path(args.current_folder))

    # blank reference (used for sizing + to match spots.json coordinates)
    if args.blank.strip():
        blank_path = Path(args.blank.strip())
    else:
        blank_path = find_latest_image(Path(args.blank_folder))

    # --- load images ---
    cur = cv2.imread(str(cur_path))
    if cur is None:
        raise FileNotFoundError(f"Could not read current image: {cur_path.resolve()}")

    blank = cv2.imread(str(blank_path))
    if blank is None:
        raise FileNotFoundError(f"Could not read blank image: {blank_path.resolve()}")

    bh, bw = blank.shape[:2]
    ch, cw = cur.shape[:2]

    # Resize current -> blank size (so spots.json polygons match)
    if (ch, cw) != (bh, bw):
        cur = cv2.resize(cur, (bw, bh), interpolation=cv2.INTER_AREA)

    print(f"Using CURRENT image: {cur_path.resolve()}  (resized from {ch}x{cw} to {bh}x{bw} if needed)")
    print(f"Using BLANK image:   {blank_path.resolve()}  (reference size {bh}x{bw})")
    print(f"Using SPOTS file:    {spots_path.resolve()}")

    spots, conf_from_json, overlap_threshold = load_spots(str(spots_path))
    conf_thres = args.conf if args.conf >= 0 else conf_from_json

    print(f"YOLO model:          {args.model} (conf={conf_thres})")
    print(f"Overlap threshold:   {overlap_threshold:.2f} of spot area")

    # --- YOLO detect cars ---
    model = YOLO(args.model)
    results = model.predict(source=cur, conf=conf_thres, verbose=False)

    names = results[0].names
    boxes = results[0].boxes

    dets = []
    for b in boxes:
        cls_id = int(b.cls.item())
        cls_name = names.get(cls_id, str(cls_id))
        if cls_name not in {"car", "truck", "bus", "motorcycle"}:
            continue

        x1, y1, x2, y2 = b.xyxy[0].tolist()
        dets.append({
            "class": cls_name,
            "conf": float(b.conf.item()),
            "bbox": [int(x1), int(y1), int(x2), int(y2)]
        })

    # --- occupancy by overlap ---
    shape_hw = (bh, bw)
    spot_masks = {}
    spot_area = {}

    for s in spots:
        m = make_polygon_mask(shape_hw, s.polygon)
        spot_masks[s.spot_id] = m
        spot_area[s.spot_id] = max(1, cv2.countNonZero(m))

    occupied_spots = set()

    for d in dets:
        x1, y1, x2, y2 = d["bbox"]
        bm = bbox_mask(shape_hw, x1, y1, x2, y2)

        for s in spots:
            inter = cv2.bitwise_and(spot_masks[s.spot_id], bm)
            inter_area = cv2.countNonZero(inter)
            ratio = inter_area / float(spot_area[s.spot_id])

            if ratio >= overlap_threshold:
                occupied_spots.add(s.spot_id)

    # --- build results ---
    out = {
        "timestamp": time.time(),
        "image_used": str(cur_path),
        "blank_used": str(blank_path),
        "free_count": 0,
        "used_count": 0,
        "free_ids": [],
        "used_ids": [],
        "free_accessible_ids": [],
        "used_accessible_ids": [],
        "detections": dets
    }

    overlay = cur.copy()

    for s in spots:
        occ = s.spot_id in occupied_spots

        if occ:
            out["used_count"] += 1
            out["used_ids"].append(s.spot_id)
            if s.spot_type == "accessible":
                out["used_accessible_ids"].append(s.spot_id)
            color = (0, 0, 255)  # red
        else:
            out["free_count"] += 1
            out["free_ids"].append(s.spot_id)
            if s.spot_type == "accessible":
                out["free_accessible_ids"].append(s.spot_id)
            color = (255, 0, 0) if s.spot_type == "accessible" else (0, 255, 0)  # blue/green

        cv2.polylines(overlay, [s.polygon], True, color, 2)
        pts = s.polygon.reshape(-1, 2)
        cx = int(np.mean(pts[:, 0]))
        cy = int(np.mean(pts[:, 1]))
        cv2.putText(overlay, s.spot_id, (cx - 18, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 2)

    # Draw detections
    for d in dets:
        x1, y1, x2, y2 = d["bbox"]
        cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 255, 255), 2)
        cv2.putText(
            overlay, f"{d['class']} {d['conf']:.2f}",
            (x1, max(15, y1 - 6)),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2
        )

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