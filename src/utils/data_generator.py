# This file is responsible for generating all 3 synthetic tables calibrated to the data i studied in notebook->real_data_eda.ipynb

import pandas as pd
import numpy as np
import random
from pathlib import Path
from datetime import datetime, timedelta
import os

OUTPUT_PATH = Path(os.getenv("DATA_PATH", r"\Users\yashc\OneDrive\Desktop\code\Risk-Copilot\data\synthetic"))
OUTPUT_PATH.mkdir(parents=True, exist_ok=True)  #if for some device or system the dir isnt there

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
        list(SEGMENT_WEIGHTS.keys()),
        size=N_CUSTOMERS,
        p=list(SEGMENT_WEIGHTS.values())
    )