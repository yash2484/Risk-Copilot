# src/agents/analytics_agent.py

from src.utils.db import run_query
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv
load_dotenv()

def get_delinquency_by_segment() -> list[dict]:
    return run_query("""
        SELECT segment,
               COUNT(*) as total_customers,
               SUM(delinquency_flag) as delinquent_count,
               ROUND(AVG(delinquency_flag) * 100, 2) as delinquency_rate,
               ROUND(AVG(risk_score), 1) as avg_risk_score,
               ROUND(AVG(utilization_ratio), 3) as avg_utilization
        FROM portfolio
        GROUP BY segment
        ORDER BY delinquency_rate DESC
    """)

def get_cross_border_summary() -> list[dict]:
    return run_query("""
        SELECT p.segment,
               COUNT(*) as cross_border_txns,
               ROUND(AVG(t.avg_spend_30d), 2) as avg_spend,
               ROUND(SUM(t.avg_spend_30d), 2) as total_volume,
               ROUND(MAX(t.max_txn_amt_30d), 2) as largest_txn
        FROM transactions t
        JOIN portfolio p ON t.customer_id = p.customer_id
        WHERE t.is_cross_border = 1
        GROUP BY p.segment
        ORDER BY total_volume DESC
    """)

def summarize_data_with_llm(data: list[dict], question: str) -> str:
    llm = ChatOpenAI(model='gpt-4o-mini', temperature=0)
    system = (
        'You are a risk analytics assistant. Summarize the data below '
        'in 2-3 concise paragraphs for a risk analyst audience. '
        'Highlight key trends, outliers, and actionable insights.'
    )
    user = f'Data:\n{data}\n\nAnalyst question: {question}'
    resp = llm.invoke([SystemMessage(content=system), HumanMessage(content=user)])
    return resp.content