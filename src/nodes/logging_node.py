# src/nodes/logging_node.py
# NOTE: Uses CSV file logging. Postgres was removed from the current build —
# sqlalchemy and psycopg2 are NOT installed. CSV is sufficient for portfolio.

import time, json, csv
from pathlib import Path
from src.state import AgentState

LOG_FILE = Path('logs/audit_log.csv')
LOG_FILE.parent.mkdir(exist_ok=True)

def logging_node(state: AgentState) -> dict:
    latency = round((time.time() - state.get('start_time', time.time())) * 1000)

    record = {
        'workflow_id':  state.get('workflow_id'),
        'timestamp':    time.strftime('%Y-%m-%d %H:%M:%S'),
        'intent':       state.get('intent'),
        'user_role':    state.get('user_role'),
        'tools_used':   '|'.join(state.get('tools_used', [])),
        'risk_flags':   json.dumps(state.get('risk_flags', [])),
        'latency_ms':   latency,
        'has_customer': bool(state.get('query_context', {}).get('customer_id')),
    }

    file_exists = LOG_FILE.exists()
    with open(LOG_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=record.keys())
        if not file_exists: writer.writeheader()
        writer.writerow(record)

    return {'tools_used': state['tools_used'] + ['logging_node']}   