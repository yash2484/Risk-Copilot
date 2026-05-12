# src/agents/risk_agent.py

import joblib
import numpy as np
import pandas as pd
import shap
from pathlib import Path
from src.utils.db import run_query

# Load model artifacts once at import time (~80MB each)
MODEL     = joblib.load('models/risk_rf_model.pkl')
FEATURES  = joblib.load('models/feature_names.pkl')
EXPLAINER = joblib.load('models/shap_explainer.pkl')

def compute_rule_score(portfolio: dict, txn: dict, login: dict) -> tuple[int, list]:
    score, flags = 0, []

    util = portfolio.get('utilization_ratio', 0)
    if util > 0.8:   score += 25; flags.append('HIGH_UTILIZATION')
    elif util > 0.5: score += 10

    if portfolio.get('delinquency_flag', 0): score += 20; flags.append('DELINQUENT')
    if txn.get('is_cross_border', 0):        score += 10; flags.append('CROSS_BORDER')
    if txn.get('charge_off_flag', 0):        score += 15; flags.append('CHARGE_OFF')

    fails = login.get('failed_attempts_24h', 0)
    if fails >= 5:   score += 20; flags.append('BRUTE_FORCE_SUSPECT')
    elif fails >= 3: score += 10; flags.append('MULTIPLE_FAILED_LOGINS')

    if login.get('new_device_flag', 0): score += 5; flags.append('NEW_DEVICE')

    return min(score, 100), flags

def compute_ml_score(portfolio: dict, txn: dict) -> tuple[float, str]:
    feature_map = {
        'utilization':      portfolio.get('utilization', 0),
        'age':              35,  # median approximation
        'past_due_30_59':   1 if portfolio.get('delinquency_flag') else 0,
        'debt_ratio':       portfolio.get('balance', 0) / max(portfolio.get('monthly_income', 1), 1),
        'monthly_income':   portfolio.get('monthly_income', 5000),
        'open_credit_lines': 8,  # population median
        'times_90d_late':   2 if portfolio.get('delinquency_flag') else 0,
        'past_due_60_89':   1 if portfolio.get('delinquency_flag') else 0,
        'dependents':       1,   # population median
    }

    X = pd.DataFrame([feature_map])[FEATURES]
    prob = MODEL.predict_proba(X)[0][1]

    shap_vals = EXPLAINER.shap_values(X)[0, :, 1]
    top3 = sorted(zip(FEATURES, shap_vals), key=lambda x: abs(x[1]), reverse=True)[:3]

    explanation = '; '.join([
        f'{f.replace("_"," ")} {"increases" if v>0 else "decreases"} risk ({v:+.3f})'
        for f, v in top3
    ])

    return round(float(prob), 4), explanation


def score_customer(customer_id: str) -> dict:
    p = run_query(f"SELECT * FROM portfolio WHERE customer_id='{customer_id}' LIMIT 1")
    if not p: return {'error': f'Customer {customer_id} not found'}
    p = p[0]

    t = run_query(
        f"SELECT avg_spend_30d, max_txn_amt_30d, is_cross_border, charge_off_flag"
        f" FROM transactions WHERE customer_id='{customer_id}' ORDER BY date DESC LIMIT 1"
    )
    t = t[0] if t else {}

    l = run_query(
        f"SELECT failed_attempts_24h, new_device_flag, ip_country"
        f" FROM login_events WHERE user_id='{customer_id}' ORDER BY timestamp DESC LIMIT 1"
    )
    l = l[0] if l else {}

    rule_score, flags = compute_rule_score(p, t, l)
    ml_prob, ml_exp   = compute_ml_score(p, t)

    combined = round((rule_score + ml_prob * 100) / 2, 1)

    return {
        'customer_id': customer_id,
        'combined_risk_score': combined,
        'rule_score':  rule_score,
        'ml_probability': ml_prob,
        'risk_flags':  flags,
        'shap_explanation': ml_exp,
        'segment':     p.get('segment'),
        "utilization":  p.get("utilization_ratio"),
        'credit_limit': p.get('credit_limit'),
    }