# src/state.py

from typing import TypedDict, Annotated, Optional
from langchain_core.messages import BaseMessage
import operator

class AgentState(TypedDict):
    # operator.add APPENDS to messages — never overwrites conversation history
    messages:          Annotated[list[BaseMessage], operator.add]
    intent:            str          # analytics | risk_fraud | policy | mixed
    user_role:         str          # analyst | manager | read_only
    query_context:     dict         # customer_id, segment, date_range_days, top_n
    tools_used:        list[str]    # audit trail of agents invoked
    analytics_results: Optional[list[dict]]
    risk_results:      Optional[dict]
    policy_results:    Optional[dict]
    risk_flags:        list[str]
    final_response:    Optional[str]
    pii_masked:        bool
    workflow_id:       str
    start_time:        float