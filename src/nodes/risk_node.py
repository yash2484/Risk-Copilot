# src/nodes/risk_node.py

from src.state import AgentState
from src.agents.risk_agent import score_customer

def risk_node(state: AgentState) -> dict:
    ctx = state['query_context']

    if ctx.get('customer_id'):
        # Single-customer investigation path
        result = score_customer(ctx['customer_id'])
        flags  = result.get('risk_flags', [])
        resp = (
            f"Customer {result.get('customer_id')}: "
            f"combined risk score {result.get('combined_risk_score')} "
            f"(rule={result.get('rule_score')}, ml={result.get('ml_probability', 0):.1%}). "
            f"Key drivers: {result.get('shap_explanation')}. "
            f"Flags: {', '.join(flags) if flags else 'None'}."
        )
    else:
        # No customer_id extracted — fall back to a portfolio-level message
        result = {'message': 'No customer_id detected in query.'}
        flags  = []
        resp   = 'Provide a customer ID like CUST_000042 for risk scoring.'

    return {
        'risk_results':   result,
        'risk_flags':     state['risk_flags'] + flags,
        'final_response': resp,
        'tools_used':     state['tools_used'] + ['risk_agent'],
    }