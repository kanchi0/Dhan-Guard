import csv
from pathlib import Path

from predictor import predict_from_path

BASE_DIR = Path(__file__).resolve().parent
TEST_DIR = BASE_DIR / "test_images"

# Same rules as main.py (starting values)
LOW_CONFIDENCE_THRESHOLD = 0.60
MARGIN_THRESHOLD = 0.15

IMAGE_TYPES = {".jpg", ".jpeg", ".png"}

rows = []

# One folder per class: the folder name is the TRUE class
for folder in sorted(p for p in TEST_DIR.iterdir() if p.is_dir()):
    for img in sorted(folder.iterdir()):
        if img.suffix.lower() not in IMAGE_TYPES:
            continue
        result = predict_from_path(img)
        top3 = result["top3"]
        confidence = result["confidence"]
        margin = top3[0]["confidence"] - top3[1]["confidence"]
        uncertain = confidence < LOW_CONFIDENCE_THRESHOLD or margin < MARGIN_THRESHOLD
        rows.append(
            {
                "true": folder.name,
                "predicted": result["disease"],
                "confidence_pct": round(confidence * 100, 1),
                "margin_pct": round(margin * 100, 1),
                "app_answer": "declined" if uncertain else "answered",
                "correct": "yes" if result["disease"] == folder.name else "no",
            }
        )

# Print the table
print()
print(f"{'True class':<24}{'Predicted':<24}{'Conf%':>7}{'Margin%':>9}  {'App':<9}Correct")
for r in rows:
    print(
        f"{r['true']:<24}{r['predicted']:<24}{r['confidence_pct']:>7}"
        f"{r['margin_pct']:>9}  {r['app_answer']:<9}{r['correct']}"
    )

# Summary
total = len(rows)
correct = sum(r["correct"] == "yes" for r in rows)
answered = [r for r in rows if r["app_answer"] == "answered"]
answered_correct = sum(r["correct"] == "yes" for r in answered)
confident_wrong = len(answered) - answered_correct

print()
print(f"Images tested            : {total}")
print(f"Correct (top-1)          : {correct} of {total}")
print(f"Answered by the app      : {len(answered)} of {total}")
print(f"Correct among answered   : {answered_correct} of {len(answered)}")
print(f"Confident wrong answers  : {confident_wrong}")

# Save for the report
with open(BASE_DIR / "sample_results.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
print("Saved: sample_results.csv")