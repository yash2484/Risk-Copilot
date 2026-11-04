# src/nodes/security.py

import re
from src.state import AgentState

def mask_pii(text: str) -> str:
    if not text: return text
    # Customer IDs: CUST_004821 → CUST_****
    text = re.sub(r'CUST_\d{6}', 'CUST_****', text)
    # 13-19 digit card-like sequences (optionally space/dash separated) → mask.
    # Covers common PANs (Visa/MC 16, Amex 15, others 13-19).
    text = re.sub(r'\b\d(?:[ -]?\d){12,18}\b', '[CARD-MASKED]', text)
    # Email addresses → [EMAIL-MASKED]
    text = re.sub(r'[\w.-]+@[\w.-]+\.\w+', '[EMAIL-MASKED]', text)
    return text


def _mask_deep(obj):
    """Recursively mask PII in strings inside nested dict/list structures.

    Defense-in-depth so PII can't leak through structured result payloads
    (analytics/risk tables), not just the free-text response.
    """
    if isinstance(obj, str):
        return mask_pii(obj)
    if isinstance(obj, dict):
        return {k: _mask_deep(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_mask_deep(v) for v in obj]
    return obj

def security_node(state: AgentState) -> dict:
    role     = state.get('user_role', 'analyst')
    response = mask_pii(state.get('final_response', ''))
    analytics = state.get('analytics_results')

    # read_only users do not see raw data tables
    if role == 'read_only' and analytics:
        analytics = [{'message': 'Raw data hidden for read_only role.'}]
    elif analytics:
        analytics = _mask_deep(analytics)

    return {
        'final_response':    response,
        'analytics_results': analytics,
        'pii_masked':        True,
        'tools_used':        state['tools_used'] + ['security_node'],
    }