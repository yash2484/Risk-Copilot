# src/nodes/security.py

import re
from src.state import AgentState

def mask_pii(text: str) -> str:
    if not text: return text
    # Customer IDs: CUST_004821 → CUST_****
    text = re.sub(r'CUST_\d{6}', 'CUST_****', text)
    # 15-16 digit sequences (card numbers) → [CARD-MASKED]
    text = re.sub(r'\b(?:\d[ -]?){15,16}\b', '[CARD-MASKED]', text)
    # Email addresses → [EMAIL-MASKED]
    text = re.sub(r'[\w.-]+@[\w.-]+\.\w+', '[EMAIL-MASKED]', text)
    return text

def security_node(state: AgentState) -> dict:
    role     = state.get('user_role', 'analyst')
    response = mask_pii(state.get('final_response', ''))
    analytics = state.get('analytics_results')

    # read_only users do not see raw data tables
    if role == 'read_only' and analytics:
        analytics = [{'message': 'Raw data hidden for read_only role.'}]

    return {
        'final_response':    response,
        'analytics_results': analytics,
        'pii_masked':        True,
        'tools_used':        state['tools_used'] + ['security_node'],
    }