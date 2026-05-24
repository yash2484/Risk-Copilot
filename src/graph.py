# src/graph.py

from langgraph.graph import StateGraph, START, END
from src.state import AgentState
from src.nodes.orchestrator   import orchestrator_node
from src.nodes.analytics_node import analytics_node
from src.nodes.risk_node      import risk_node
from src.nodes.policy_node    import policy_node
from src.nodes.security       import security_node
from src.nodes.logging_node   import logging_node

# ── ROUTING FUNCTIONS ────────────────────────────────────────

def route_after_orchestrator(state: AgentState) -> str:
    intent = state['intent']
    if intent == 'analytics':  return 'analytics_node'
    if intent == 'risk_fraud': return 'risk_node'
    if intent == 'policy':     return 'policy_node'
    # mixed → start with analytics, the chain continues through risk and policy
    return 'analytics_node'

def route_after_analytics(state: AgentState) -> str:
    return 'risk_node' if state['intent'] == 'mixed' else 'security_node'

def route_after_risk(state: AgentState) -> str:
    return 'policy_node' if state['intent'] == 'mixed' else 'security_node'

# ── GRAPH CONSTRUCTION ───────────────────────────────────────

def build_graph():
    g = StateGraph(AgentState)

    # Register every node
    g.add_node('orchestrator',   orchestrator_node)
    g.add_node('analytics_node', analytics_node)
    g.add_node('risk_node',      risk_node)
    g.add_node('policy_node',    policy_node)
    g.add_node('security_node',  security_node)
    g.add_node('logging_node',   logging_node)

    # Entry point — every query starts at the orchestrator
    g.add_edge(START, 'orchestrator')

    # Orchestrator branches to one of three agent nodes based on intent
    g.add_conditional_edges('orchestrator', route_after_orchestrator,
        {'analytics_node': 'analytics_node',
         'risk_node':      'risk_node',
         'policy_node':    'policy_node'})

    # Analytics can chain to risk (for mixed queries)
    g.add_conditional_edges('analytics_node', route_after_analytics,
        {'risk_node':     'risk_node',
         'security_node': 'security_node'})

    # Risk can chain to policy (for mixed queries)
    g.add_conditional_edges('risk_node', route_after_risk,
        {'policy_node':   'policy_node',
         'security_node': 'security_node'})

    # Policy always goes to security
    g.add_edge('policy_node',   'security_node')

    # Security always goes to logging
    g.add_edge('security_node', 'logging_node')

    # Logging ends the graph
    g.add_edge('logging_node',  END)

    return g.compile()

# Module-level compiled graph — import this in api/main.py and run_test.py
GRAPH = build_graph()