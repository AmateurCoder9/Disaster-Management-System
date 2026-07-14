"""Generate synthetic training data for the disaster priority model.

Run:  python data/generate_synthetic_data.py   (from backend/)
"""

import csv
import os
import random
import statistics

ROWS = 1000
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "synthetic_training_data.csv")


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def generate() -> None:
    random.seed(42)

    rows: list[dict] = []
    for _ in range(ROWS):
        severity = random.randint(1, 5)
        population = random.randint(100, 50_000)
        accessibility = random.randint(1, 5)

        base = (severity * 20) + (population / 1000) + ((6 - accessibility) * 10)
        noise = random.gauss(0, 5)
        priority_score = clamp(base + noise, 1, 100)

        rows.append({
            "severity": severity,
            "population": population,
            "accessibility": accessibility,
            "priority_score": round(priority_score, 2),
        })

    # ── Write CSV ────────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["severity", "population", "accessibility", "priority_score"])
        writer.writeheader()
        writer.writerows(rows)

    # ── Summary ──────────────────────────────────────────────────────────
    scores = [r["priority_score"] for r in rows]
    print(f"Generated {ROWS} rows -> {OUTPUT_PATH}")
    print(f"  priority_score  min={min(scores):.2f}  max={max(scores):.2f}  "
          f"mean={statistics.mean(scores):.2f}  stdev={statistics.stdev(scores):.2f}")


if __name__ == "__main__":
    generate()
