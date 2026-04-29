# src/utils/data_generator.py

# This file generates all 3 synthetic tables calibrated to the real
# GMSC data studied in notebooks/01_real_data_eda.ipynb

# Tables generated:
#   portfolio.parquet       — 50,000 customer records
#   transactions.parquet    — 500,000 transaction rows (~10 per customer)
#   login_events.parquet    — 200,000 login event rows (~4 per customer)

# Every distribution choice traces back to a number measured in the
# EDA notebook. See inline comments for the mapping.

import pandas as pd
import numpy as np
import random
from pathlib import Path
from datetime import datetime, timedelta
import os

OUTPUT_PATH = Path(os.getenv("DATA_PATH", "./data/synthetic"))
OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

N_CUSTOMERS   = 50_000    # portfolio rows
N_TX_ROWS     = 500_000   # transaction rows (10 per customer on average)
N_LOGIN_ROWS  = 200_000   # login event rows (4 per customer on average)

random.seed(42)
np.random.seed(42)

# Why these constants:
# 50,000 customers gives a realistic portfolio size while staying fast
# to generate (under 30 seconds). 500,000 transactions gives 10 rows
# per customer on average — enough for trend queries. random.seed(42)
# makes the data reproducible: every time you regenerate, you get the
# same customers, same delinquency rate, same risk scores.


# PORTFOLIO GENERATION


def generate_portfolio():
    print("Generating portfolio...")

    # Customer IDs: CUST_000001 ... CUST_050000 
    ids = [f"CUST_{i:06d}" for i in range(1, N_CUSTOMERS + 1)]

    # Segments — 5 groups with realistic proportions 
    SEGMENT_WEIGHTS = {
        "Premium":       0.10,   # High spend, low risk — 10% of portfolio
        "Standard":      0.40,   # Bread-and-butter customers — 40%
        "New_To_Credit": 0.15,   # Limited history, moderate risk — 15%
        "High_Value":    0.15,   # Large credit lines, careful payers — 15%
        "Subprime":      0.20,   # Elevated risk, tighter credit — 20%
    }
    segments = np.random.choice(
        list(SEGMENT_WEIGHTS.keys()),
        size=N_CUSTOMERS,
        p=list(SEGMENT_WEIGHTS.values())
    )

    # Products — segment-specific, not random across the board
    # Only certain products are available to certain segments.
    # A Subprime customer cannot get a Signature card.

    PRODUCT_MAP = {
        "Premium":       ["Platinum", "Signature"],
        "Standard":      ["Classic", "Gold"],
        "New_To_Credit": ["Secured", "Classic"],
        "High_Value":    ["Signature", "World_Elite"],
        "Subprime":      ["Secured", "Classic"],
    }
    products = [random.choice(PRODUCT_MAP[s]) for s in segments]

    # Credit limits — segment-driven with normal distribution
    # Each tuple is (mean, std_dev) for that segment's credit limit.
    # Normal distribution gives natural variation within each segment.

    CREDIT_LIMIT_PARAMS = {
        "Premium":       (15000, 5000),
        "Standard":      (7500,  2500),
        "New_To_Credit": (2000,  500),
        "High_Value":    (30000, 10000),
        "Subprime":      (3000,  1000),
    }
    credit_limits = np.array([
        max(500, np.random.normal(*CREDIT_LIMIT_PARAMS[s]))
        for s in segments
    ]).round(2)
    # max(500, ...) ensures no credit limit falls below $500 regardless
    # of what the random draw produces. $500 is a realistic minimum for
    # a usable credit card.

    # ── Utilization — beta distribution calibrated to real GMSC data ──
    # Beta(2,5): right-skewed, peaks around 0.25, long tail toward 1.0
    # This matches the "most customers < 0.4, spike near 1.0" shape
    # from EDA notebook Cell 4.
    raw_util = np.random.beta(2, 5, N_CUSTOMERS)

    # Subprime customers have elevated utilization (reversed beta shape)
    subprime_mask = segments == "Subprime"
    raw_util[subprime_mask] = np.random.beta(5, 2, subprime_mask.sum())
    utilization = raw_util.clip(0.01, 0.99)

    # Balance = utilization × credit_limit (derived, not independent)
    balances = (utilization * credit_limits).round(2)

    # ── Delinquency — 6.7% overall rate from real GMSC (EDA Cell 3) ──
    # Subprime: 18%, everyone else: 4.2%
    # Weighted average: (0.20 × 0.18) + (0.80 × 0.042) = 0.036 + 0.034 ≈ 0.070
    # Close to real 6.7% — slight overshoot is fine for a richer dataset.
    delinquency_probs = np.where(subprime_mask, 0.18, 0.042)
    delinquency_flags = (np.random.random(N_CUSTOMERS) < delinquency_probs).astype(int)

    # ── Risk scores (0-100) — derived from delinquency + utilization ──
    # Formula: delinquency × 35 + utilization × 40 + noise(±8) + baseline
    # This creates meaningful correlation between risk score and the
    # features the ML model will use, while noise prevents it from
    # being a perfect function (which would be unrealistic).
    risk_scores = (
        delinquency_flags * 35
        + utilization * 40
        + np.random.normal(0, 8, N_CUSTOMERS)
    ).clip(0, 100).round(1)

    # ── Monthly income — log-normal, segment-driven ───────────────────
    # Added so the risk_agent can use real income instead of approximating
    # it as credit_limit × 0.15. Log-normal matches real income distributions.
    INCOME_PARAMS = {
        "Premium":       (8.8, 0.4),    # median ~$6,600
        "Standard":      (8.5, 0.5),    # median ~$4,900
        "New_To_Credit": (8.2, 0.4),    # median ~$3,600
        "High_Value":    (9.2, 0.5),    # median ~$9,900
        "Subprime":      (8.0, 0.6),    # median ~$3,000
    }
    monthly_income = np.array([
        max(1200, np.random.lognormal(*INCOME_PARAMS[s]))
        for s in segments
    ]).round(0).astype(int)

    # ── Months since last delinquency ─────────────────────────────────
    # Delinquent customers: 1-24 months ago (recent enough to matter)
    # Non-delinquent customers: 0 (meaning never, or not applicable)
    # Useful for analytics queries and policy rule matching.
    months_since_last_delinquency = np.where(
        delinquency_flags == 1,
        np.random.randint(1, 25, N_CUSTOMERS),
        0
    )

    # ── Open dates — random date in last 5 years ─────────────────────
    base_date = datetime(2020, 1, 1)
    open_dates = [base_date + timedelta(days=random.randint(0, 1825))
                  for _ in range(N_CUSTOMERS)]

    # ── Assemble DataFrame ───────────────────────────────────────────
    # Column names here are the source of truth for the entire project.
    # risk_agent.py, analytics_agent.py, and db.py all reference these
    # exact column names. Do NOT rename without updating downstream.
    df = pd.DataFrame({
        "customer_id":                  ids,
        "segment":                      segments,
        "product_type":                 products,
        "credit_limit":                 credit_limits,
        "balance":                      balances,
        "utilization_ratio":            utilization.round(4),
        "delinquency_flag":             delinquency_flags,
        "risk_score":                   risk_scores,
        "monthly_income":               monthly_income,
        "months_since_last_delinquency": months_since_last_delinquency,
        "open_date":                    [d.strftime("%Y-%m-%d") for d in open_dates],
    })

    df.to_parquet(OUTPUT_PATH / "portfolio.parquet", index=False)
    print(f"  Portfolio: {len(df):,} rows | Delinquency: {df.delinquency_flag.mean():.3f}")
    return df


# ══════════════════════════════════════════════════════════════════════
# TRANSACTION GENERATION
# ══════════════════════════════════════════════════════════════════════

def generate_transactions(portfolio_df):
    print("Generating transactions...")
    cust_ids = portfolio_df["customer_id"].values
    today = datetime.now()

    # Pre-index portfolio as a dict — O(1) lookup instead of O(50000) scan
    portfolio_lookup = portfolio_df.set_index("customer_id").to_dict("index")

    CATEGORIES = ["Groceries", "Travel", "Dining", "Retail", "Healthcare",
                  "Cash_Advance", "Utilities", "Entertainment"]

    # 85% domestic, 15% international — calibrated to typical card spend mix
    COUNTRIES = (["US"] * 85 +
                 ["UK", "CA", "DE", "FR", "MX", "IN", "CN",
                  "AU", "SG", "AE", "BR", "NG", "RU", "KR"])

    rows = []
    for cust_id in np.random.choice(cust_ids, N_TX_ROWS, replace=True):
        row_info = portfolio_lookup[cust_id]

        # Base spend is proportional to credit limit with lognormal noise
        base_spend = max(100, row_info["credit_limit"] * 0.08 *
                         np.random.lognormal(0, 0.5))

        country = np.random.choice(COUNTRIES)
        is_cross = 1 if country != "US" else 0

        # High-utilization customers: Cash_Advance weighted 10x higher
        # This creates the distress signal: maxed-out card → cash advance
        if row_info["utilization_ratio"] < 0.8:
            w = [3, 2, 3, 3, 1, 0.3, 2, 2]     # normal spending pattern
        else:
            w = [2, 1, 2, 2, 1, 3, 2, 1]        # distressed: heavy cash advance
        w = [x / sum(w) for x in w]
        category = np.random.choice(CATEGORIES, p=w)

        # Charge-off: realistic ~18% of delinquent accounts charge off
        charge_off = 1 if (row_info["delinquency_flag"] == 1 and
                           np.random.random() < 0.18) else 0

        tx_date = (today - timedelta(days=random.randint(0, 90))).strftime("%Y-%m-%d")

        rows.append({
            "customer_id":       cust_id,
            "date":              tx_date,
            "avg_spend_30d":     round(base_spend, 2),
            "max_txn_amt_30d":   round(base_spend * np.random.uniform(1.5, 8), 2),
            "merchant_category": category,
            "country":           country,
            "is_cross_border":   is_cross,
            "charge_off_flag":   charge_off,
        })

    df = pd.DataFrame(rows)
    df.to_parquet(OUTPUT_PATH / "transactions.parquet", index=False)
    print(f"  Transactions: {len(df):,} rows | Charge-off: {df.charge_off_flag.mean():.3f}")
    return df


# ══════════════════════════════════════════════════════════════════════
# LOGIN EVENT GENERATION
# ══════════════════════════════════════════════════════════════════════

def generate_login_events(portfolio_df):
    print("Generating login events...")
    cust_ids = portfolio_df["customer_id"].values

    rows = []
    for i in range(N_LOGIN_ROWS):
        cid = np.random.choice(cust_ids)

        ts = datetime(2024, 1, 1) + timedelta(
            days=np.random.randint(0, 365),
            hours=np.random.randint(0, 24),
            minutes=np.random.randint(0, 60)
        )
    
        # 5% of login events are anomalous — enough for the risk agent
        # to flag without overwhelming the dataset
        is_anomalous = np.random.random() < 0.05

        # Anomalous logins get non-US IPs, new devices, high failed attempts
        # — matching real fraud patterns the risk scoring rules look for
        if is_anomalous:
            ip_country = np.random.choice(["RU", "CN", "NG", "BR"])
        else:
            ip_country = np.random.choice(
                ["US", "US", "US", "US", "GB", "IN", "NG", "BR", "RU", "CN"]
            )

        rows.append({
            "event_id":            f"LOGIN_{i:08d}",
            "user_id":             cid,
            "timestamp":           ts.strftime("%Y-%m-%d %H:%M:%S"),
            "ip_country":          ip_country,
            "device_type":         np.random.choice(
                                       ["mobile", "desktop", "tablet"],
                                       p=[0.55, 0.35, 0.10]),
            "new_device_flag":     int(is_anomalous or np.random.random() < 0.08),
            "failed_attempts_24h": (np.random.randint(3, 10) if is_anomalous
                                    else int(np.random.choice([0, 0, 0, 0, 1, 2, 3, 5]))),
            "login_success":       int(not is_anomalous or np.random.random() < 0.4),
        })

    df = pd.DataFrame(rows)
    df.to_parquet(OUTPUT_PATH / "login_events.parquet", index=False)
    print(f"  Login events: {len(df):,} rows | Anomaly rate: {(df.failed_attempts_24h >= 3).mean():.3f}")
    return df


# ══════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ══════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    port = generate_portfolio()
    generate_transactions(port)
    generate_login_events(port)
    print("\nAll synthetic data generated successfully.")
    print(f"Output directory: {OUTPUT_PATH}")