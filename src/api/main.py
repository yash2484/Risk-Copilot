# src/api/main.py

import time, uuid, csv
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from src.graph import GRAPH
from dotenv import load_dotenv
from src.utils.db import run_query
load_dotenv()

app = FastAPI(
    title='Risk & Insights Copilot API',
    description='Multi-agent LangGraph copilot for credit risk analytics',
    version='1.0.0'
)

# CORS — allow the Streamlit frontend (or any client) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# ── REQUEST / RESPONSE MODELS ─────────────────────────────────

class ChatRequest(BaseModel):
    message:   str
    user_role: str = 'analyst'  # analyst | manager | read_only

class ChatResponse(BaseModel):
    workflow_id: str
    intent:      str
    response:    str
    tools_used:  list[str]
    risk_flags:  list[str]
    latency_ms:  float

# ── ENDPOINTS ─────────────────────────────────────────────────

@app.post('/chat', response_model=ChatResponse)
async def chat(req: ChatRequest):
    wf_id = str(uuid.uuid4())
    start = time.time()

    initial = {
        'messages':          [HumanMessage(content=req.message)],
        'intent':            '',
        'user_role':         req.user_role,
        'query_context':     {},
        'tools_used':        [],
        'analytics_results': None,
        'risk_results':      None,
        'policy_results':    None,
        'risk_flags':        [],
        'final_response':    None,
        'pii_masked':        False,
        'workflow_id':       wf_id,
        'start_time':        start,
    }

    try:
        result = GRAPH.invoke(initial)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return ChatResponse(
        workflow_id = wf_id,
        intent      = result.get('intent', 'unknown'),
        response    = result.get('final_response', 'No response generated.'),
        tools_used  = result.get('tools_used', []),
        risk_flags  = result.get('risk_flags', []),
        latency_ms  = round((time.time() - start) * 1000, 1),
    )

@app.get('/health')
async def health():
    return {'status': 'healthy', 'version': '1.0.0'}

@app.get('/metrics')
async def metrics():
    log = Path('logs/audit_log.csv')
    if not log.exists():
        return {'total_queries': 0, 'intent_breakdown': {}, 'avg_latency_ms': 0}

    with open(log, encoding='utf-8') as f:
        rows = list(csv.DictReader(f))

    # Count queries per intent
    intents = {}
    for r in rows:
        intents[r['intent']] = intents.get(r['intent'], 0) + 1

    # Average latency across all queries
    avg_lat = sum(float(r['latency_ms']) for r in rows) / max(len(rows), 1)

    return {
        'total_queries':    len(rows),
        'intent_breakdown': intents,
        'avg_latency_ms':   round(avg_lat, 1),
    }

@app.get('/analytics/segments')
async def analytics_segments():
    """
    Segment data for the React dashboard. Direct DuckDB query —
    no LLM call, no token cost, sub-50ms response.
    """
    return run_query("""
        SELECT segment,
               COUNT(*) as customers,
               ROUND(AVG(delinquency_flag) * 100, 2) as delinq_pct,
               ROUND(AVG(utilization_ratio) * 100, 1) as util_pct,
               ROUND(AVG(risk_score), 1) as avg_risk
        FROM portfolio
        GROUP BY segment
        ORDER BY delinq_pct DESC
    """)