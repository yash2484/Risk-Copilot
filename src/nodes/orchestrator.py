# src/nodes/orchestrator.py

import json, time, uuid
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from src.state import AgentState
from dotenv import load_dotenv
load_dotenv()

llm = ChatOpenAI(model='gpt-4o-mini', temperature=0)

PROMPT = """You are an orchestrator for a risk analytics copilot.
Classify the query and extract entities. Respond ONLY with valid JSON:
{
  "intent": "analytics | risk_fraud | policy | mixed",
  "customer_id": "extracted ID or null",
  "segment": "segment name or null",
  "date_range_days": 90,
  "top_n": 10
}
intent guide:
analytics  = portfolio data, trends, segments, KPIs
  risk_fraud = customer investigations, fraud, login anomalies
  policy     = internal policies, guidelines, procedures
  mixed      = needs data AND policy combined"""

def orchestrator_node(state: AgentState) -> dict:
    query    = state['messages'][-1].content
    response = llm.invoke([SystemMessage(content=PROMPT),
                           HumanMessage(content=f'Query: {query}')])
    try:
        parsed = json.loads(response.content)
    except json.JSONDecodeError:
        # If the LLM returns malformed JSON, default to analytics intent
        parsed = {'intent':'analytics','customer_id':None,
                  'segment':None,'date_range_days':90,'top_n':10}

    VALID_INTENTS = {'analytics', 'risk_fraud', 'policy', 'mixed'}
    raw_intent = parsed.get('intent', 'analytics')
    # If LLM returned the template string instead of choosing, default to analytics
    intent = raw_intent if raw_intent in VALID_INTENTS else 'analytics'

    return {
        'intent':        intent,
        'query_context': {'customer_id':     parsed.get('customer_id'),
                          'segment':         parsed.get('segment'),
                          'date_range_days': parsed.get('date_range_days',90),
                          'top_n':           parsed.get('top_n',10)},
        'tools_used':    ['orchestrator'],
        'risk_flags':    [],
        'pii_masked':    False,
        'workflow_id':   state.get('workflow_id', str(uuid.uuid4())),
        'start_time':    state.get('start_time', time.time()),
    }
