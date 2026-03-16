import argparse
from pathlib import Path

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


def align_to_blank(current_bgr, blank_bgr, max_features=5000, good_match_percent=0.15):
    blank_gray = cv2.cvtColor(blank_bgr, cv2.COLOR_BGR2GRAY)
    cur_gray = cv2.cvtColor(current_bgr, cv2.COLOR_BGR2GRAY)

    # help with lighting differences
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    blank_gray = clahe.apply(blank_gray)
    cur_gray = clahe.apply(cur_gray)

    orb = cv2.ORB_create(nfeatures=max_features)
    kp1, des1 = orb.detectAndCompute(cur_gray, None)
    kp2, des2 = orb.detectAndCompute(blank_gray, None)

    if des1 is None or des2 is None:
        raise RuntimeError("Could not find enough features to align (descriptors are None).")

    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    matches = matcher.knnMatch(des1, des2, k=2)

    good = []
    for m, n in matches:
        if m.distance < 0.75 * n.distance:
            good.append(m)

    if len(good) < 12:
        raise RuntimeError(f"Not enough good matches to compute homography: {len(good)}")

    good = sorted(good, key=lambda x: x.distance)
    keep = max(12, int(len(good) * good_match_percent))
    good = good[:keep]

    pts_cur = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    pts_blank = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)

    H, mask = cv2.findHomography(pts_cur, pts_blank, cv2.RANSAC, 5.0)
    if H is None:
        raise RuntimeError("Homography failed (H is None).")

    inliers = int(mask.sum()) if mask is not None else 0
    info = {
        "good_matches": len(good),
        "inliers": inliers,
        "inlier_ratio": inliers / max(1, len(good)),
    }

    h, w = blank_bgr.shape[:2]
    aligned = cv2.warpPerspective(current_bgr, H, (w, h), flags=cv2.INTER_LINEAR)

    return aligned, H, info


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--current_folder", default="current_lot", help="Folder with current images")
    ap.add_argument("--blank_folder", default="blank_lot", help="Folder with blank reference images")
    ap.add_argument("--out", default="current_lot/aligned_latest.jpg", help="Output aligned image path")
    args = ap.parse_args()

    cur_path = find_latest_image(Path(args.current_folder))
    blank_path = find_latest_image(Path(args.blank_folder))

    cur = cv2.imread(str(cur_path))
    blank = cv2.imread(str(blank_path))

    if cur is None:
        raise FileNotFoundError(f"Could not read current image: {cur_path.resolve()}")
    if blank is None:
        raise FileNotFoundError(f"Could not read blank image: {blank_path.resolve()}")

    aligned, _, info = align_to_blank(cur, blank)
    cv2.imwrite(args.out, aligned)

    print(f"Using CURRENT: {cur_path.resolve()}")
    print(f"Using BLANK:   {blank_path.resolve()}")
    print(f"Saved ALIGNED: {Path(args.out).resolve()}")
    print(f"Alignment info: {info}")


if __name__ == "__main__":
    main()