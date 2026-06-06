# tests/test_risk_agent.py
from src.agents.risk_agent import compute_rule_score

def test_high_utilization_adds_score():
    p = {'utilization_ratio': 0.92, 'delinquency_flag': 0}
    t = {'avg_spend_30d': 500, 'max_txn_amt_30d': 600,
         'is_cross_border': 0, 'charge_off_flag': 0}
    l = {'failed_attempts_24h': 0, 'new_device_flag': 0}
    score, flags = compute_rule_score(p, t, l)
    assert score >= 20
    assert any('utilization' in f.lower() for f in flags)

def test_login_anomaly_full_combination():
    p = {'utilization_ratio': 0.3, 'delinquency_flag': 0}
    t = {'avg_spend_30d': 400, 'max_txn_amt_30d': 500,
         'is_cross_border': 0, 'charge_off_flag': 0}
    l = {'failed_attempts_24h': 5, 'new_device_flag': 1}
    score, flags = compute_rule_score(p, t, l)
    assert score >= 25

def test_clean_customer_zero_score():
    p = {'utilization_ratio': 0.2, 'delinquency_flag': 0}
    t = {'avg_spend_30d': 300, 'max_txn_amt_30d': 400,
         'is_cross_border': 0, 'charge_off_flag': 0}
    l = {'failed_attempts_24h': 0, 'new_device_flag': 0}
    score, flags = compute_rule_score(p, t, l)
    assert score == 0 and len(flags) == 0

def test_score_capped_at_100():
    p = {'utilization_ratio': 0.99, 'delinquency_flag': 1}
    t = {'avg_spend_30d': 100, 'max_txn_amt_30d': 5000,
         'is_cross_border': 1, 'charge_off_flag': 1}
    l = {'failed_attempts_24h': 8, 'new_device_flag': 1}
    score, _ = compute_rule_score(p, t, l)
    assert score <= 100