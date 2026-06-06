# tests/test_policy_agent.py
from src.agents.policy_agent import retrieve_policy

def test_retrieval_returns_results():
    results = retrieve_policy('cross border transaction escalation', top_k=3)
    assert len(results) > 0

def test_retrieval_has_source_field():
    results = retrieve_policy('delinquency collections policy', top_k=2)
    for r in results:
        assert 'source' in r and len(r['source']) > 0

def test_retrieval_returns_relevant_chunk():
    results = retrieve_policy('Level 2 escalation cross border', top_k=3)
    sources = [r['source'] for r in results]
    assert 'cross_border_risk_policy' in sources