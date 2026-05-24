# src/nodes/analytics_node.py

from src.state import AgentState
from src.agents.analytics_agent import (
    get_delinquency_by_segment,
    get_cross_border_summary,
    summarize_data_with_llm
)

def analytics_node(state: AgentState) -> dict:
    query   = state['messages'][-1].content
    q_lower = query.lower()

    # Route to the right analytics function based on keyword detection
    if 'cross' in q_lower or 'international' in q_lower or 'border' in q_lower:
        results = get_cross_border_summary()
    else:
        # Default for delinquency, segment, portfolio questions
        results = get_delinquency_by_segment()

    summary = summarize_data_with_llm(results, query)

    return {
        'analytics_results': results,
        'final_response':    summary,
        'tools_used':        state['tools_used'] + ['analytics_agent'],
    }