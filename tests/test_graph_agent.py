# tests/test_graph.py
import time, uuid
from langchain_core.messages import HumanMessage
from src.graph import GRAPH

def make_state(q, role='analyst'):
    return {'messages':[HumanMessage(content=q)],'intent':'','user_role':role,
            'query_context':{},'tools_used':[],'analytics_results':None,
            'risk_results':None,'policy_results':None,'risk_flags':[],
            'final_response':None,'pii_masked':False,
            'workflow_id':str(uuid.uuid4()),'start_time':time.time()}

def test_analytics_routing():
    r = GRAPH.invoke(make_state('Show me the top risk segments'))
    assert r['intent'] == 'analytics'
    assert 'analytics_agent' in r['tools_used']
    assert r['pii_masked'] is True

def test_policy_routing():
    r = GRAPH.invoke(make_state('What does policy say about credit line increases?'))
    assert r['intent'] == 'policy'
    assert 'policy_agent' in r['tools_used']

def test_security_always_runs():
    for q in ['top segments', 'check login anomalies', 'escalation policy']:
        r = GRAPH.invoke(make_state(q))
        assert r['pii_masked'] is True, f'Security node skipped for: {q}'

def test_read_only_strips_raw_data():
    r = GRAPH.invoke(make_state('Show segment data', role='read_only'))
    if r.get('analytics_results'):
        assert 'message' in r['analytics_results'][0]