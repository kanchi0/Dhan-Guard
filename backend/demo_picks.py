from pathlib import Path

from predictor import predict_from_path

TEST_DIR = Path(__file__).resolve().parent / "test_images"
MIN_CONF = 0.70    # same values as main.py
MIN_MARGIN = 0.20

print()
for folder in sorted(p for p in TEST_DIR.iterdir() if p.is_dir()):
    for img in sorted(folder.iterdir()):
        if img.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        r = predict_from_path(img)
        margin = r["top3"][0]["confidence"] - r["top3"][1]["confidence"]
        declined = r["confidence"] < MIN_CONF or margin < MIN_MARGIN
        verdict = "DECLINED" if declined else ("correct" if r["disease"] == folder.name else "WRONG")
        print(f"{folder.name} | {img.name} | {r['disease']} {r['confidence'] * 100:.1f}% | {verdict}")