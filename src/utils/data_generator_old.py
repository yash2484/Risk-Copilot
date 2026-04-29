# This file is responsible for generating all 3 synthetic tables calibrated to the data i studied in notebook->real_data_eda.ipynb

import pandas as pd
import numpy as np
import random
from pathlib import Path
from datetime import datetime, timedelta
import os

OUTPUT_PATH = Path(os.getenv("DATA_PATH", r"\Users\yashc\OneDrive\Desktop\code\Risk-Copilot\data\synthetic"))
OUTPUT_PATH.mkdir(parents=True, exist_ok=True)  # if for some device or system the dir isnt there

N_CUSTOMERS   = 50_000    # portfolio rows
N_TX_ROWS     = 500_000   # transaction rows (10 per customer on average)
N_LOGIN_ROWS  = 200_000   # login event rows (4 per customer on average)

random.seed(42)   
np.random.seed(42)

# why these constants: 
# 50,000 customers gives a realistic portfolio size while staying fast to generate (under 30 seconds).
# 500,000 transactions gives 10 rows per customer on average — enough for trend queries. 
# random.seed(42) makes the data reproducible: 
# every time you regenerate, you get the same customers, same delinquency rate, same risk scores.


def generate_portfolio():
    print("Generating portfolio...")

    # Customer IDs: CUST_000001 ... CUST_050000
    ids = [f"CUST_{i:06d}" for i in range(1, N_CUSTOMERS + 1)]

    # Customer segments — 5 groups with realistic proportions
    SEGMENT_WEIGHTS = {
        "Premium":       0.10,   # High spend, low risk — 10% of portfolio
        "Standard":      0.40,   # Bread-and-butter customers — 40%
        "New_To_Credit": 0.15,   # Limited history, moderate risk — 15%
        "High_Value":    0.15,   # Large credit lines, careful payers — 15%
        "Subprime":      0.20,   # Elevated risk, tighter credit — 20%
    }
    segments = np.random.choice(
        list(SEGMENT_WEIGHTS.keys()),       # The options to pick from
        size=N_CUSTOMERS,                   # How many picks to make
        p=list(SEGMENT_WEIGHTS.values())    # Probability of each option
        )
    
    # Product types per segment
    PRODUCT_MAP = {
        "Premium":       ["Platinum", "Signature"],
        "Standard":      ["Classic", "Gold"],
        "New_To_Credit": ["Secured", "Classic"],
        "High_Value":    ["Signature", "World_Elite"],
        "Subprime":      ["Secured", "Classic"],
    }
    products = [random.choice(PRODUCT_MAP[s]) for s in segments]

    # Credit limits — segment-driven with realistic lognormal spread
         #Each tuple is (mean, standard_deviation) for that segment's credit limit distribution.
    CREDIT_LIMIT_PARAMS = {         
        "Premium":       (15000, 5000),     
        "Standard":      (7500,  2500),
        "New_To_Credit": (2000,  500),
        "High_Value":    (30000, 10000),
        "Subprime":      (3000,  1000),
    }
    credit_limits = np.array([
        max(500, np.random.normal(*CREDIT_LIMIT_PARAMS[s])) #This is the safety net. A normal distribution theoretically extends to negative infinity
        for s in segments
    ]).round(2)
    
    #contd-
    # at the far left tail a Standard customer could theoretically get a credit limit of -$3,000, which is nonsensical. 
    #max(500, ...) ensures no credit limit ever falls below $500 regardless of what the random draw produces.
    #Why $500 specifically? It's a realistic minimum for a real credit card — below that the card is essentially unusable.

    
    #Each customer gets a credit limit that is realistic for their segment but with natural variation
    #no two customers are identical.

    # Utilization — beta distribution calibrated to real GMSC data
    
    # Beta(2,5): right-skewed, peaks around 0.25, long tail toward 1.0
    # This matches the "most customers < 0.4, spike near 1.0" shape from EDA notebook
    raw_util = np.random.beta(2, 5, N_CUSTOMERS)

    # Subprime customers have elevated utilization
    subprime_mask = segments == "Subprime"
    raw_util[subprime_mask] = np.random.beta(5, 2, subprime_mask.sum())
    utilization = raw_util.clip(0.01, 0.99)

    # Balance = utilization * credit_limit
    balances = (utilization * credit_limits).round(2)   #deriving it keeps it consistent

    # Delinquency — 6.7% rate from real data (EDA Cell 3)
    # Subprime customers have elevated delinquency probability
    delinquency_probs = np.where(subprime_mask, 0.18, 0.042)
    delinquency_flags = (np.random.random(N_CUSTOMERS) < delinquency_probs).astype(int)


 # Risk scores (0-100): derived from delinquency + utilization + noise
    risk_scores = (
        delinquency_flags * 35       # Delinquency adds 35 base points
        + utilization * 40           # Utilization adds up to 40 points
        + np.random.normal(0, 8, N_CUSTOMERS)  # Noise ±8 points
    ).clip(0, 100).round(1)

    # Open dates: random date in last 5 years
    base_date = datetime(2020, 1, 1)
    open_dates = [base_date + timedelta(days=random.randint(0, 1825))
                  for _ in range(N_CUSTOMERS)]

    df = pd.DataFrame({
        "customer_id":      ids,
        "segment":          segments,
        "product_type":     products,
        "credit_limit":     credit_limits,
        "balance":          balances,
        "utilization_ratio": utilization.round(4),
        "delinquency_flag": delinquency_flags,
        "risk_score":       risk_scores,
        "open_date":        [d.strftime("%Y-%m-%d") for d in open_dates],
    })

    df.to_parquet(OUTPUT_PATH / "portfolio.parquet", index=False)
    print(f"  Portfolio: {len(df):,} rows | Delinquency: {df.delinquency_flag.mean():.3f}")
    return df


    
# generating transactions and transaction history table-

def generate_transactions(portfolio_df):    
    print("Generating transactions...")
    cust_ids = portfolio_df["customer_id"].values
    today = datetime.now()

    CATEGORIES = ["Groceries","Travel","Dining","Retail","Healthcare",
                  "Cash_Advance","Utilities","Entertainment"]

    # 85% domestic, 15% international — calibrated to typical card spend mix
    COUNTRIES = ["US"]*85 + ["UK","CA","DE","FR","MX","IN","CN",
                             "AU","SG","AE","BR","NG","RU","KR"]

    rows = []
    for cust_id in np.random.choice(cust_ids, N_TX_ROWS, replace=True):
        row_info = portfolio_df[portfolio_df.customer_id == cust_id].iloc[0]

        # Base spend is proportional to credit limit with lognormal noise
        base_spend = max(100, row_info["credit_limit"] * 0.08 *
                         np.random.lognormal(0, 0.5))

        country = np.random.choice(COUNTRIES)
        is_cross = 1 if country != "US" else 0

        # High-utilization customers: Cash_Advance weighted 10x higher
        # This creates the distress signal: maxed-out card → cash advance
        w = [3,2,3,3,1,0.3,2,2] if row_info["utilization_ratio"] < 0.8 else [2,1,2,2,1,3,2,1]
        w = [x/sum(w) for x in w]
        category = np.random.choice(CATEGORIES, p=w)

        # Charge-off: realistic ~18% of delinquent accounts charge off
        charge_off = 1 if (row_info["delinquency_flag"]==1 and
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