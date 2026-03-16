import argparse
import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple, Any

import cv2
import numpy as np

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
    spot_type: str  # "regular" or "accessible"
    polygon: np.ndarray  # shape (N, 1, 2), int32


class ParkingDetector:
    def __init__(self, spots_json_path: str, empty_reference_path: str):
        with open(spots_json_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)

        self.occupied_ratio_threshold: float = float(cfg.get("occupied_ratio_threshold", 0.025))

        self.spots: List[Spot] = []
        for s in cfg["spots"]:
            poly = np.array(s["polygon"], dtype=np.int32).reshape((-1, 1, 2))
            self.spots.append(Spot(spot_id=s["id"], spot_type=s.get("type", "regular"), polygon=poly))

        empty_bgr = cv2.imread(empty_reference_path)
        if empty_bgr is None:
            raise FileNotFoundError(f"Could not read empty reference image: {empty_reference_path}")

        self.empty_gray = self._prep_gray(empty_bgr)

    @staticmethod
    def _prep_gray(bgr: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        return gray

    @staticmethod
    def _polygon_mask(shape_hw: Tuple[int, int], polygon: np.ndarray) -> np.ndarray:
        mask = np.zeros(shape_hw, dtype=np.uint8)
        cv2.fillPoly(mask, [polygon], 255)
        return mask

    def analyze(self, frame_bgr: np.ndarray, annotate: bool = True) -> Dict[str, Any]:
        # --- NEW: ensure current frame matches empty reference size ---
        eh, ew = self.empty_gray.shape[:2]
        fh, fw = frame_bgr.shape[:2]

        if (fh, fw) != (eh, ew):
            # Resize current to match empty reference (keeps spots.json coordinates correct)
            frame_bgr = cv2.resize(frame_bgr, (ew, eh), interpolation=cv2.INTER_AREA)
            # Optional: print once
            if not hasattr(self, "_resize_warned"):
                print(f"[WARN] Resized current image from ({fh}, {fw}) to ({eh}, {ew}) to match empty reference.")
                self._resize_warned = True

        frame_gray = self._prep_gray(frame_bgr)

        diff = cv2.absdiff(frame_gray, self.empty_gray)

        _, diff_bin = cv2.threshold(diff, 45, 255, cv2.THRESH_BINARY)

        kernel = np.ones((3, 3), np.uint8)
        diff_bin = cv2.morphologyEx(diff_bin, cv2.MORPH_OPEN, kernel, iterations=1)
        diff_bin = cv2.morphologyEx(diff_bin, cv2.MORPH_CLOSE, kernel, iterations=1)

        results = {
            "timestamp": time.time(),
            "free_count": 0,
            "used_count": 0,
            "free_ids": [],
            "used_ids": [],
            "free_accessible_ids": [],
            "used_accessible_ids": []
        }

        overlay = frame_bgr.copy() if annotate else None

        for spot in self.spots:
            mask = self._polygon_mask(diff_bin.shape[:2], spot.polygon)

            changed = cv2.bitwise_and(diff_bin, diff_bin, mask=mask)
            changed_pixels = cv2.countNonZero(changed)

            area_pixels = cv2.countNonZero(mask)
            if area_pixels == 0:
                continue

            changed_ratio = changed_pixels / float(area_pixels)
            occupied = changed_ratio > self.occupied_ratio_threshold

            if occupied:
                results["used_count"] += 1
                results["used_ids"].append(spot.spot_id)
                if spot.spot_type == "accessible":
                    results["used_accessible_ids"].append(spot.spot_id)
            else:
                results["free_count"] += 1
                results["free_ids"].append(spot.spot_id)
                if spot.spot_type == "accessible":
                    results["free_accessible_ids"].append(spot.spot_id)

            if annotate:
                if occupied:
                    color = (0, 0, 255)  # red
                else:
                    color = (0, 255, 0) if spot.spot_type != "accessible" else (255, 0, 0)  # green / blue

                cv2.polylines(overlay, [spot.polygon], True, color, 2)

                pts = spot.polygon.reshape(-1, 2)
                cx = int(np.mean(pts[:, 0]))
                cy = int(np.mean(pts[:, 1]))
                cv2.putText(overlay, spot.spot_id, (cx - 20, cy),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        if annotate:
            results["annotated_bgr"] = overlay

        return results


def main():
    ap = argparse.ArgumentParser()

    # New: folder-based mode (defaults)
    ap.add_argument("--current_folder", default="current_lot", help="Folder with current lot images")
    ap.add_argument("--blank_folder", default="blank_lot", help="Folder with empty/blank lot images")
    ap.add_argument("--spots", default="spots.json", help="Path to spots.json")

    # Optional overrides (if you ever want)
    ap.add_argument("--image", default="", help="Optional: specific current image path (overrides current_folder)")
    ap.add_argument("--empty", default="", help="Optional: specific empty image path (overrides blank_folder)")

    ap.add_argument("--out", default="annotated.jpg", help="Output path for annotated image")
    args = ap.parse_args()

    # Pick current image
    if args.image.strip():
        current_path = Path(args.image.strip())
    else:
        current_path = find_latest_image(Path(args.current_folder))

    # Pick empty reference
    if args.empty.strip():
        empty_path = Path(args.empty.strip())
    else:
        empty_path = find_latest_image(Path(args.blank_folder))

    if not Path(args.spots).exists():
        raise FileNotFoundError(f"spots.json not found: {Path(args.spots).resolve()}")

    print(f"Using CURRENT image: {current_path.resolve()}")
    print(f"Using EMPTY image:   {empty_path.resolve()}")
    print(f"Using SPOTS file:    {Path(args.spots).resolve()}")

    img = cv2.imread(str(current_path))
    if img is None:
        raise FileNotFoundError(f"Could not read input image: {current_path}")

    detector = ParkingDetector(args.spots, str(empty_path))
    res = detector.analyze(img, annotate=True)

    print("\nRESULTS")
    print(f"Free: {res['free_count']}, Used: {res['used_count']}")
    print(f"Free IDs: {res['free_ids']}")
    print(f"Free Accessible IDs: {res['free_accessible_ids']}")

    if args.out and "annotated_bgr" in res:
        cv2.imwrite(args.out, res["annotated_bgr"])
        print(f"Annotated image saved to: {Path(args.out).resolve()}")


if __name__ == "__main__":
    main()