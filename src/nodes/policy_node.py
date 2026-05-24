# src/nodes/policy_node.py

from src.state import AgentState
from src.agents.policy_agent import answer_policy_question

def policy_node(state: AgentState) -> dict:
    query   = state['messages'][-1].content
    context = []

    # For mixed queries, inject upstream agent outputs as additional context
    if state.get('analytics_results'):
        context.append(f"Analytics findings: {state.get('final_response', '')}")
    if state.get('risk_results'):
        rr = state['risk_results']
        context.append(
            f"Risk score: {rr.get('combined_risk_score')}, "
            f"flags: {rr.get('risk_flags', [])}"
        )

    # Prefix the user query with context if any upstream agents ran
    enriched_query = query
    if context:
        enriched_query = (
            "Context from upstream agents:\n" + " | ".join(context) +
            f"\n\nUser question: {query}"
        )

    result = answer_policy_question(enriched_query)

    return {
        'policy_results':  result,
        'final_response':  result['answer'],
        'tools_used':      state['tools_used'] + ['policy_agent'],
    }