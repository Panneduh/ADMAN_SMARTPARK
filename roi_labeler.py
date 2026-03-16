import json
import argparse
from pathlib import Path
from typing import Optional

import cv2
import numpy as np


IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def find_latest_image(folder: Path) -> Path:
    if not folder.exists() or not folder.is_dir():
        raise FileNotFoundError(f"Folder not found: {folder.resolve()}")

    images = [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS]
    if not images:
        raise FileNotFoundError(
            f"No images found in {folder.resolve()} (supported: {sorted(IMAGE_EXTS)})"
        )

    # Most recently modified
    images.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return images[0]


def load_image(path: Path):
    img = cv2.imread(str(path))
    if img is None:
        raise FileNotFoundError(f"Could not read image: {path.resolve()}")
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--folder", default="blank_lot", help="Folder containing blank-lot images (default: blank_lot)")
    ap.add_argument("--image", default="", help="Optional: specific image filename inside --folder (overrides latest)")
    ap.add_argument("--out", default="spots.json", help="Output spots.json path")
    args = ap.parse_args()

    folder = Path(args.folder)

    if args.image.strip():
        image_path = folder / args.image.strip()
        if not image_path.exists():
            raise FileNotFoundError(f"Image not found: {image_path.resolve()}")
    else:
        image_path = find_latest_image(folder)

    print(f"Using image: {image_path.resolve()}")
    img = load_image(image_path)

    spots = []
    current_points = []
    current_type = "regular"

    help_text = [
        "Click 4 corners for a spot",
        "Keys:",
        "  n = name this spot (enter PS id)",
        "  t = toggle type regular/accessible",
        "  u = undo last point",
        "  s = save json",
        "  q = quit"
    ]

    def redraw():
        canvas = img.copy()

        # draw existing spots
        for s in spots:
            poly = np.array(s["polygon"], dtype=np.int32).reshape((-1, 1, 2))
            color = (0, 255, 0) if s["type"] == "regular" else (255, 0, 0)
            cv2.polylines(canvas, [poly], True, color, 2)

            pts = poly.reshape(-1, 2)
            cx, cy = int(np.mean(pts[:, 0])), int(np.mean(pts[:, 1]))
            cv2.putText(canvas, s["id"], (cx - 20, cy),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        # draw current in-progress
        for p in current_points:
            cv2.circle(canvas, p, 4, (0, 255, 255), -1)

        if len(current_points) >= 2:
            cv2.polylines(canvas, [np.array(current_points, dtype=np.int32)],
                          False, (0, 255, 255), 2)

        y = 20
        for line in help_text:
            cv2.putText(canvas, line, (10, y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
            y += 22

        cv2.putText(canvas, f"Current type: {current_type}", (10, y + 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)

        cv2.imshow("ROI Labeler", canvas)

    def on_mouse(event, x, y, flags, param):
        nonlocal current_points
        if event == cv2.EVENT_LBUTTONDOWN:
            current_points.append((x, y))
            redraw()

    cv2.namedWindow("ROI Labeler", cv2.WINDOW_NORMAL)
    cv2.setMouseCallback("ROI Labeler", on_mouse)
    redraw()

    while True:
        key = cv2.waitKey(0) & 0xFF

        if key == ord("q"):
            break

        if key == ord("u"):
            if current_points:
                current_points.pop()
                redraw()

        if key == ord("t"):
            current_type = "accessible" if current_type == "regular" else "regular"
            redraw()

        if key == ord("n"):
            if len(current_points) < 4:
                print("Need 4 points before naming the spot.")
                continue

            spot_id = input("Enter spot id (ex: PS1): ").strip()
            if not spot_id:
                print("Invalid id.")
                continue

            spots.append({
                "id": spot_id,
                "type": current_type,
                "polygon": current_points[:4]
            })
            current_points = []
            print(f"Added {spot_id} ({current_type})")
            redraw()

        if key == ord("s"):
            out = {
                "occupied_ratio_threshold": 0.025,
                "spots": spots
            }
            with open(args.out, "w", encoding="utf-8") as f:
                json.dump(out, f, indent=2)
            print(f"Saved: {Path(args.out).resolve()}")

    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()