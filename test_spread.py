from src.agents.risk_agent import score_customer
from src.utils.db import run_query

print("=" * 60)
print("Sampling some HIGH-RISK customers (delinquent + high utilization)")
print("=" * 60)

high_risk = run_query("""
    SELECT customer_id, segment, utilization_ratio, delinquency_flag, risk_score
    FROM portfolio
    WHERE delinquency_flag = 1 AND utilization_ratio > 0.8
    ORDER BY risk_score DESC
    LIMIT 5
""")
for r in high_risk:
    print(f"\n  {r['customer_id']} | seg={r['segment']} | util={r['utilization_ratio']:.3f} | delinq={r['delinquency_flag']}")
    result = score_customer(r['customer_id'])
    print(f"    score={result['combined_risk_score']}  rule={result['rule_score']}  ml={result['ml_probability']:.3f}")
    print(f"    flags={result['risk_flags']}")
    print(f"    shap={result['shap_explanation']}")

print("\n" + "=" * 60)
print("Sampling some LOW-RISK customers (no delinquency, low utilization)")
print("=" * 60)

low_risk = run_query("""
    SELECT customer_id, segment, utilization_ratio, delinquency_flag, risk_score
    FROM portfolio
    WHERE delinquency_flag = 0 AND utilization_ratio < 0.2 AND segment = 'Premium'
    ORDER BY risk_score ASC
    LIMIT 5
""")
for r in low_risk:
    print(f"\n  {r['customer_id']} | seg={r['segment']} | util={r['utilization_ratio']:.3f}")
    result = score_customer(r['customer_id'])
    print(f"    score={result['combined_risk_score']}  rule={result['rule_score']}  ml={result['ml_probability']:.3f}")