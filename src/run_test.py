# src/run_test.py

import time, uuid
from langchain_core.messages import HumanMessage
from src.graph import GRAPH

def make_state(query, role='analyst'):
    return {
        'messages':          [HumanMessage(content=query)],
        'intent':            '',
        'user_role':         role,
        'query_context':     {},
        'tools_used':        [],
        'analytics_results': None,
        'risk_results':      None,
        'policy_results':    None,
        'risk_flags':        [],
        'final_response':    None,
        'pii_masked':        False,
        'workflow_id':       str(uuid.uuid4()),
        'start_time':        time.time(),
    }

tests = [
    'Show me the top risk segments by delinquency rate',
    'What does policy say about credit line increases?',
    'Investigate customer CUST_000042 and summarize their risk',
    'Customer CUST_000042 has a high risk score — what action does policy recommend?',
]

for q in tests:
    print(f'\n--- {q} ---')
    r = GRAPH.invoke(make_state(q))
    print(f'Intent: {r["intent"]} | Agents: {r["tools_used"]}')
    print(f'Response: {str(r["final_response"])[:400]}')