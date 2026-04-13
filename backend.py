from fastapi import FastAPI, HTTPException
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # MUST come before pyplot import — stops matplotlib trying to open a GUI window
import matplotlib.pyplot as plt
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import io
import numpy as np
from file_extracter import csv_to_dict_list

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

racers = csv_to_dict_list("db_drivers.csv")
race_results = pd.read_csv("db_race_results.csv")
drivers = pd.read_csv("db_drivers.csv")
events = pd.read_csv("db_events.csv")
lap_times = pd.read_csv("db_lap_times.csv")


@app.get("/racers")
def get_racers():
    return racers

@app.get("/plots/{driver_id}")
def avg_lap_time_per_compound(driver_id: str):
    COMPOUNDS = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"]
    compound_colors = {
        "SOFT": "#e8002d",
        "MEDIUM": "#ffd600",
        "HARD": "#c8c8c8",
        "INTERMEDIATE": "#43b02a",
        "WET": "#0067ff",
    }

    df = lap_times[
        (lap_times["driver_id"] == driver_id) &
        (lap_times["lap_time_seconds"].notna())
    ]

    if df.empty:
        raise HTTPException(status_code=404, detail=f"No lap time data for driver '{driver_id}'")

    avg = df.groupby("compound")["lap_time_seconds"].mean()
    avg = avg.reindex([c for c in COMPOUNDS if c in avg.index])

    driver_rows = drivers[drivers["driver_id"] == driver_id]
    if driver_rows.empty:
        raise HTTPException(status_code=404, detail=f"Driver '{driver_id}' not found")
    driver_row = driver_rows.iloc[0]
    display_name = f"{driver_row['first_name']} {driver_row['last_name']}"

    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(
        avg.index,
        avg.values,
        color=[compound_colors[c] for c in avg.index],
        edgecolor="none",
        width=0.5,
    )
    ax.bar_label(bars, fmt="%.2f", fontsize=9, padding=3)
    ax.set_title(f"{display_name} — Avg Lap Time by Compound", fontsize=13)
    ax.set_xlabel("Compound")
    ax.set_ylabel("Avg Lap Time (seconds)")
    ax.grid(axis="y", alpha=0.3)
    ax.set_ylim(avg.min() * 0.98, avg.max() * 1.03)
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150)
    buf.seek(0)
    plt.close(fig)  # free memory

    return StreamingResponse(buf, media_type="image/png")


@app.get("/radar/{driver_id}")
def average_stats_per_driver(driver_id: str):
    df = race_results[race_results["driver_id"] == driver_id]

    if df.empty:
        raise HTTPException(status_code=404, detail=f"No race results for driver '{driver_id}'")

    total_races = len(df)

    raw = {
        "Avg Finish":  df["position"].mean(),
        "Avg Grid":    df["grid_position"].mean(),
        "Points/Race": df["points"].mean(),
        "Podium Rate": (df["position"] <= 3).sum() / total_races,
        "Finish Rate": (df["status"] == "Finished").sum() / total_races,
    }

    normalized = {
        "Avg Finish":  1 - (raw["Avg Finish"] - 1) / 19,
        "Avg Grid":    1 - (raw["Avg Grid"] - 1) / 19,
        "Points/Race": raw["Points/Race"] / 25,
        "Podium Rate": raw["Podium Rate"],
        "Finish Rate": raw["Finish Rate"],
    }

    labels = list(normalized.keys())
    values = list(normalized.values())
    N = len(labels)
    values += values[:1]
    angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
    angles += angles[:1]

    driver_rows = drivers[drivers["driver_id"] == driver_id]
    if driver_rows.empty:
        raise HTTPException(status_code=404, detail=f"Driver '{driver_id}' not found")
    driver_row = driver_rows.iloc[0]
    display_name = f"{driver_row['first_name']} {driver_row['last_name']}"
    team_color = f"#{driver_row['team_color']}"

    fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))
    ax.plot(angles, values, color=team_color, linewidth=2)
    ax.fill(angles, values, color=team_color, alpha=0.25)
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels, fontsize=11)
    ax.set_yticks([0.25, 0.5, 0.75, 1.0])
    ax.set_yticklabels(["0.25", "0.50", "0.75", "1.00"], fontsize=7, color="grey")
    ax.set_ylim(0, 1)
    for angle, label, raw_val in zip(angles[:-1], labels, raw.values()):
        ax.annotate(
            f"{raw_val:.2f}",
            xy=(angle, normalized[label]),
            fontsize=8,
            ha="center",
            color=team_color,
            fontweight="bold",
        )
    ax.set_title(f"{display_name}", fontsize=15, fontweight="bold", pad=20)
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150)
    buf.seek(0)
    plt.close(fig)

    return StreamingResponse(buf, media_type="image/png")


@app.get("/podium/{driver_id}")
def podium_breakdown_by_driver(driver_id: str):
    df = race_results[race_results["driver_id"] == driver_id].copy()

    if df.empty:
        raise HTTPException(status_code=404, detail=f"No race results for driver '{driver_id}'")

    def classify(row):
        if row["position"] == 1:   return "1st"
        elif row["position"] == 2: return "2nd"
        elif row["position"] == 3: return "3rd"
        else:                      return "Off-Podium"

    df["result_type"] = df.apply(classify, axis=1)

    order = ["1st", "2nd", "3rd", "Off-Podium"]
    colors = {
        "1st":        "#FFD700",
        "2nd":        "#C0C0C0",
        "3rd":        "#CD7F32",
        "Off-Podium": "#44C8F5",
    }
    counts = df["result_type"].value_counts().reindex(order, fill_value=0)

    driver_rows = drivers[drivers["driver_id"] == driver_id]
    if driver_rows.empty:
        raise HTTPException(status_code=404, detail=f"Driver '{driver_id}' not found")
    driver_row = driver_rows.iloc[0]
    display_name = f"{driver_row['first_name']} {driver_row['last_name']}"

    fig, ax = plt.subplots(figsize=(8, 4))
    left = 0
    for category in order:
        value = counts[category]
        if value == 0:
            continue
        ax.barh(display_name, value, left=left, color=colors[category], edgecolor="none", label=category)
        ax.text(
            left + value / 2, 0, str(value),
            ha="center", va="center",
            fontsize=10, fontweight="bold", color="black"
        )
        left += value

    ax.set_xlabel("Number of Races")
    ax.set_title(f"{display_name} — Season Result Breakdown", fontsize=13)
    ax.legend(loc="upper right", bbox_to_anchor=(1, 1.3), ncol=len(order))
    ax.set_xlim(0, len(df))
    ax.grid(axis="x", alpha=0.3)
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150)
    buf.seek(0)
    plt.close(fig)

    return StreamingResponse(buf, media_type="image/png")