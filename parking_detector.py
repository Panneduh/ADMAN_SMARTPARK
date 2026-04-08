# ./.venv/bin/python parking_detector_yolo_zoom_v2.py --tiled --model yolov8s.pt --imgsz 1536 --roi_scale 1.8 --vehicle_classes car,truck --bbox_shrink 0.55
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

# COCO class ids
COCO_IDS = {
    "car": 2,
    "motorcycle": 3,
    "bus": 5,
    "truck": 7,
}


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
    spot_type: str  # "regular" or "accessible"
    polygon: np.ndarray  # (N, 1, 2) int32


def load_spots(spots_path: str) -> Tuple[List[Spot], float, float]:
    with open(spots_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    spots: List[Spot] = []
    for s in cfg["spots"]:
        poly = np.array(s["polygon"], dtype=np.int32).reshape((-1, 1, 2))
        spots.append(Spot(spot_id=s["id"], spot_type=s.get("type", "regular"), polygon=poly))

    yolo_conf = float(cfg.get("yolo_conf_threshold", 0.20))
    overlap_th = float(cfg.get("overlap_threshold", 0.12))
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


def spots_roi(spots: List[Spot], w: int, h: int, margin: int = 40) -> Tuple[int, int, int, int]:
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


def iou_xyxy(a, b) -> float:
    x1 = max(a[0], b[0])
    y1 = max(a[1], b[1])
    x2 = min(a[2], b[2])
    y2 = min(a[3], b[3])
    inter_w = max(0, x2 - x1)
    inter_h = max(0, y2 - y1)
    inter = inter_w * inter_h
    area_a = max(0, a[2] - a[0]) * max(0, a[3] - a[1])
    area_b = max(0, b[2] - b[0]) * max(0, b[3] - b[1])
    union = area_a + area_b - inter
    return 0.0 if union <= 0 else inter / union


def nms(dets: List[Dict[str, Any]], iou_th: float = 0.5) -> List[Dict[str, Any]]:
    dets = sorted(dets, key=lambda d: d["conf"], reverse=True)
    kept = []
    for d in dets:
        keep = True
        for k in kept:
            if iou_xyxy(d["bbox"], k["bbox"]) >= iou_th:
                keep = False
                break
        if keep:
            kept.append(d)
    return kept


def shrink_bbox_xyxy(b: List[int], shrink: float) -> List[int]:
    """
    shrink=1.0 => unchanged
    shrink=0.6 => center 60% of width/height
    """
    x1, y1, x2, y2 = b
    cx = (x1 + x2) / 2.0
    cy = (y1 + y2) / 2.0
    w = (x2 - x1) * shrink
    h = (y2 - y1) * shrink
    nx1 = int(cx - w / 2)
    ny1 = int(cy - h / 2)
    nx2 = int(cx + w / 2)
    ny2 = int(cy + h / 2)
    return [nx1, ny1, nx2, ny2]


def scale_bboxes(dets: List[Dict[str, Any]], sx: float, sy: float) -> List[Dict[str, Any]]:
    for d in dets:
        x1, y1, x2, y2 = d["bbox"]
        d["bbox"] = [int(x1 / sx), int(y1 / sy), int(x2 / sx), int(y2 / sy)]
    return dets


def yolo_detect_vehicles(model: YOLO, img_bgr: np.ndarray, conf: float, imgsz: int, class_ids: List[int]) -> List[Dict[str, Any]]:
    results = model.predict(source=img_bgr, conf=conf, imgsz=imgsz, classes=class_ids, verbose=False)

    boxes = results[0].boxes
    names = results[0].names
    dets = []
    for b in boxes:
        cls_id = int(b.cls.item())
        cls_name = names.get(cls_id, str(cls_id))
        x1, y1, x2, y2 = b.xyxy[0].tolist()
        dets.append({
            "class": cls_name,
            "conf": float(b.conf.item()),
            "bbox": [int(x1), int(y1), int(x2), int(y2)],
        })
    return dets


def yolo_detect_vehicles_tiled(
    model: YOLO,
    img_bgr: np.ndarray,
    conf: float,
    imgsz: int,
    class_ids: List[int],
    tile_size: int = 1024,
    overlap: float = 0.40,
    nms_iou: float = 0.5,
) -> List[Dict[str, Any]]:
    H, W = img_bgr.shape[:2]
    step = max(1, int(tile_size * (1.0 - overlap)))

    all_dets: List[Dict[str, Any]] = []
    for y0 in range(0, H, step):
        for x0 in range(0, W, step):
            y1 = min(y0 + tile_size, H)
            x1 = min(x0 + tile_size, W)
            tile = img_bgr[y0:y1, x0:x1]
            if tile.size == 0:
                continue

            dets_tile = yolo_detect_vehicles(model, tile, conf=conf, imgsz=imgsz, class_ids=class_ids)

            for d in dets_tile:
                bx1, by1, bx2, by2 = d["bbox"]
                d["bbox"] = [bx1 + x0, by1 + y0, bx2 + x0, by2 + y0]
                all_dets.append(d)

            if x1 == W:
                break
        if y1 == H:
            break

    return nms(all_dets, iou_th=nms_iou)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--spots", default="spots.json")
    ap.add_argument("--current_folder", default="current_lot")
    ap.add_argument("--blank_folder", default="blank_lot")
    ap.add_argument("--image", default="")
    ap.add_argument("--blank", default="")

    ap.add_argument("--model", default="yolov8s.pt")
    ap.add_argument("--conf", default=-1.0, type=float)

    ap.add_argument("--imgsz", default=1536, type=int)
    ap.add_argument("--roi_scale", default=1.8, type=float)

    ap.add_argument("--tiled", action="store_true")
    ap.add_argument("--tile_size", default=1024, type=int)
    ap.add_argument("--tile_overlap", default=0.40, type=float)
    ap.add_argument("--nms_iou", default=0.5, type=float)

    # NEW: pick what “vehicle” classes count as occupied
    ap.add_argument("--vehicle_classes", default="car,truck", help="comma list: car,truck,bus,motorcycle")

    # NEW: shrink factor to avoid spillover
    ap.add_argument("--bbox_shrink", default=0.60, type=float, help="0.45-0.70 works well")

    ap.add_argument("--out", default="annotated_yolo.jpg")
    ap.add_argument("--json_out", default="latest_result.json")
    args = ap.parse_args()

    spots_path = Path(args.spots)
    if not spots_path.exists():
        raise FileNotFoundError(f"spots.json not found: {spots_path.resolve()}")

    cur_path = Path(args.image.strip()) if args.image.strip() else find_latest_image(Path(args.current_folder))
    blank_path = Path(args.blank.strip()) if args.blank.strip() else find_latest_image(Path(args.blank_folder))

    cur = cv2.imread(str(cur_path))
    if cur is None:
        raise FileNotFoundError(f"Could not read current image: {cur_path.resolve()}")

    blank = cv2.imread(str(blank_path))
    if blank is None:
        raise FileNotFoundError(f"Could not read blank image: {blank_path.resolve()}")

    spots, conf_from_json, overlap_threshold = load_spots(str(spots_path))
    conf_thres = args.conf if args.conf >= 0 else conf_from_json

    # Resize current -> blank size so spots.json coordinates match
    bh, bw = blank.shape[:2]
    ch, cw = cur.shape[:2]
    if (ch, cw) != (bh, bw):
        cur = cv2.resize(cur, (bw, bh), interpolation=cv2.INTER_AREA)

    print(f"Using CURRENT: {cur_path.resolve()} (resized to {bh}x{bw} if needed)")
    print(f"Using BLANK:   {blank_path.resolve()} (reference size {bh}x{bw})")
    print(f"Using SPOTS:   {spots_path.resolve()}")

    # Parse vehicle classes
    requested = [c.strip().lower() for c in args.vehicle_classes.split(",") if c.strip()]
    for c in requested:
        if c not in COCO_IDS:
            raise ValueError(f"Unknown vehicle class '{c}'. Use: {list(COCO_IDS.keys())}")
    class_ids = [COCO_IDS[c] for c in requested]
    print(f"Vehicle classes: {requested} (ids={class_ids})")

    model = YOLO(args.model)

    # --- ROI crop (zoom to only parking lot area) ---
    H, W = cur.shape[:2]
    rx1, ry1, rx2, ry2 = spots_roi(spots, W, H, margin=40)
    roi = cur[ry1:ry2, rx1:rx2]

    roi_scale = float(args.roi_scale)
    if roi_scale != 1.0:
        roi_up = cv2.resize(roi, None, fx=roi_scale, fy=roi_scale, interpolation=cv2.INTER_CUBIC)
    else:
        roi_up = roi

    # --- Detect vehicles inside ROI ---
    if args.tiled:
        dets = yolo_detect_vehicles_tiled(
            model, roi_up,
            conf=conf_thres, imgsz=args.imgsz, class_ids=class_ids,
            tile_size=args.tile_size, overlap=args.tile_overlap, nms_iou=args.nms_iou
        )
    else:
        dets = yolo_detect_vehicles(model, roi_up, conf=conf_thres, imgsz=args.imgsz, class_ids=class_ids)

    # Scale boxes back down if ROI was upscaled
    if roi_scale != 1.0:
        dets = scale_bboxes(dets, roi_scale, roi_scale)

    # Shift ROI boxes back to full-image coords
    for d in dets:
        x1, y1, x2, y2 = d["bbox"]
        d["bbox"] = [x1 + rx1, y1 + ry1, x2 + rx1, y2 + ry1]

    # Precompute spot masks
    shape_hw = (H, W)
    spot_masks = {}
    spot_area = {}
    for s in spots:
        m = make_polygon_mask(shape_hw, s.polygon)
        spot_masks[s.spot_id] = m
        spot_area[s.spot_id] = max(1, cv2.countNonZero(m))

    # --- NEW OCCUPANCY LOGIC ---
    # 1) shrink bbox to a "center box"
    # 2) for each detection, assign it to ONLY ONE spot (max overlap)
    assigned_to_spot = {}  # spot_id -> list of dets
    occupied_spots = set()

    shrink = float(args.bbox_shrink)

    for d in dets:
        sb = shrink_bbox_xyxy(d["bbox"], shrink=shrink)
        bm = bbox_mask(shape_hw, sb[0], sb[1], sb[2], sb[3])

        best_spot = None
        best_ratio = 0.0

        for s in spots:
            inter = cv2.bitwise_and(spot_masks[s.spot_id], bm)
            inter_area = cv2.countNonZero(inter)
            ratio = inter_area / float(spot_area[s.spot_id])
            if ratio > best_ratio:
                best_ratio = ratio
                best_spot = s.spot_id

        # Only mark occupied if overlap is strong enough
        if best_spot is not None and best_ratio >= overlap_threshold:
            occupied_spots.add(best_spot)
            assigned_to_spot.setdefault(best_spot, []).append({
                **d,
                "bbox_center": sb,
                "best_ratio": best_ratio
            })

    # --- build output ---
    out = {
        "timestamp": time.time(),
        "image_used": str(cur_path),
        "blank_used": str(blank_path),
        "vehicle_classes": requested,
        "bbox_shrink": shrink,
        "free_count": 0,
        "used_count": 0,
        "free_ids": [],
        "used_ids": [],
        "free_accessible_ids": [],
        "used_accessible_ids": [],
        "detections": dets,
        "roi": [rx1, ry1, rx2, ry2],
        "roi_scale": roi_scale,
    }

    overlay = cur.copy()

    # draw spots
    for s in spots:
        occ = s.spot_id in occupied_spots
        if occ:
            out["used_count"] += 1
            out["used_ids"].append(s.spot_id)
            if s.spot_type == "accessible":
                out["used_accessible_ids"].append(s.spot_id)
            color = (0, 0, 255)
        else:
            out["free_count"] += 1
            out["free_ids"].append(s.spot_id)
            if s.spot_type == "accessible":
                out["free_accessible_ids"].append(s.spot_id)
            color = (255, 0, 0) if s.spot_type == "accessible" else (0, 255, 0)

        cv2.polylines(overlay, [s.polygon], True, color, 2)
        pts = s.polygon.reshape(-1, 2)
        cx = int(np.mean(pts[:, 0]))
        cy = int(np.mean(pts[:, 1]))
        cv2.putText(overlay, s.spot_id, (cx - 18, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 2)

    # draw detections as SMALL center boxes (so they don't spill)
    for spot_id, ds in assigned_to_spot.items():
        for d in ds:
            x1, y1, x2, y2 = d["bbox_center"]
            cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 255, 255), 2)
            cv2.putText(
                overlay,
                f"{d['class']} {d['conf']:.2f}",
                (x1, max(15, y1 - 6)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 255),
                2
            )

    # draw ROI rectangle so you can verify
    cv2.rectangle(overlay, (rx1, ry1), (rx2, ry2), (255, 255, 0), 2)

    cv2.imwrite(args.out, overlay)
    with open(args.json_out, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)

    print("\nRESULTS")
    print(f"Free: {out['free_count']} | Used: {out['used_count']}")
    print(f"Free IDs: {out['free_ids']}")
    print(f"Free Accessible IDs: {out['free_accessible_ids']}")
    print(f"Saved annotated: {Path(args.out).resolve()}")
    print(f"Saved JSON:      {Path(args.json_out).resolve()}")


if __name__ == "__main__":
    main()