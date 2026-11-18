import csv
import sys
from pathlib import Path

from predictor import predict_from_path

BASE_DIR = Path(__file__).resolve().parent
EVAL_DIR = BASE_DIR / "eval_data"
IMAGE_TYPES = {".jpg", ".jpeg", ".png"}

# Threshold pairs to compare: (minimum confidence, minimum margin)
PAIRS = [
    (0.00, 0.00),  # no rule: answer everything
    (0.50, 0.10),
    (0.60, 0.15),  # current values in main.py
    (0.70, 0.20),
    (0.80, 0.20),
    (0.90, 0.30),
]


def run_split(split_name):
    """Run the model on every image in eval_data/<split_name>/<class>/."""
    split_dir = EVAL_DIR / split_name
    if not split_dir.is_dir():
        print(f"Folder not found: {split_dir}")
        sys.exit(1)
    rows = []
    for folder in sorted(p for p in split_dir.iterdir() if p.is_dir()):
        for img in sorted(folder.iterdir()):
            if img.suffix.lower() not in IMAGE_TYPES:
                continue
            result = predict_from_path(img)
            top3 = result["top3"]
            rows.append(
                {
                    "true": folder.name,
                    "predicted": result["disease"],
                    "confidence": result["confidence"],
                    "margin": top3[0]["confidence"] - top3[1]["confidence"],
                }
            )
    return rows


def evaluate(rows, min_conf, min_margin):
    """Count answers and mistakes for one threshold pair."""
    total = len(rows)
    answered = [
        r for r in rows
        if r["confidence"] >= min_conf and r["margin"] >= min_margin
    ]
    right = sum(r["true"] == r["predicted"] for r in answered)
    return {
        "total": total,
        "answered": len(answered),
        "coverage": len(answered) / total * 100,
        "accuracy": (right / len(answered) * 100) if answered else 0.0,
        "confident_wrong": len(answered) - right,
    }


def print_table(title, rows, pairs):
    print()
    print(title)
    print(f"{'Min conf':>9}{'Min margin':>12}{'Answered':>10}{'Coverage%':>11}{'Accuracy%':>11}{'Wrong answers':>15}")
    for min_conf, min_margin in pairs:
        s = evaluate(rows, min_conf, min_margin)
        print(
            f"{min_conf:>9.2f}{min_margin:>12.2f}"
            f"{s['answered']:>6} of {s['total']:<3}"
            f"{s['coverage']:>10.1f}{s['accuracy']:>11.1f}{s['confident_wrong']:>15}"
        )


# Part 1: validation images (used to CHOOSE the thresholds)
val_rows = run_split("val")
overall = sum(r["true"] == r["predicted"] for r in val_rows) / len(val_rows) * 100
print(f"Validation images: {len(val_rows)}. Top-1 accuracy with no rule: {overall:.1f}%")
print_table("VALIDATION: choose the thresholds here", val_rows, PAIRS)

with open(BASE_DIR / "val_results.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(val_rows[0].keys()))
    writer.writeheader()
    writer.writerows(val_rows)
print("Saved: val_results.csv")

# Part 2: test images, only when you pass the chosen pair, for example:
#   python tune_thresholds.py 0.70 0.20
if len(sys.argv) == 3:
    chosen = (float(sys.argv[1]), float(sys.argv[2]))
    test_rows = run_split("test")
    print_table("TEST: final report, run ONCE with the chosen pair", test_rows, [chosen])
    with open(BASE_DIR / "test_results.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(test_rows[0].keys()))
        writer.writeheader()
        writer.writerows(test_rows)
    print("Saved: test_results.csv")
else:
    print()
    print("Test images were NOT used. Choose a pair, then run: python tune_thresholds.py <conf> <margin>")