# src/pages/analytics_dashboard.py

import streamlit as st
import plotly.express as px
import duckdb
from pathlib import Path

st.set_page_config(page_title='Portfolio Analytics', layout='wide')
st.title('📈 Portfolio Analytics Dashboard')

@st.cache_data


def get_conn():
    """Create a fresh DuckDB connection — not cached."""
    conn = duckdb.connect()
    base = Path('data/synthetic').resolve().as_posix()
    conn.execute(f"CREATE VIEW portfolio AS SELECT * FROM read_parquet('{base}/portfolio.parquet')")
    conn.execute(f"CREATE VIEW transactions AS SELECT * FROM read_parquet('{base}/transactions.parquet')")
    return conn

@st.cache_data
def load_segment_data():
    """Cache the actual data, not the connection."""
    conn = get_conn()
    return conn.execute("""
        SELECT segment, COUNT(*) AS customers,
               ROUND(AVG(delinquency_flag)*100,2) AS delinq_pct,
               ROUND(AVG(utilization_ratio)*100,1) AS util_pct,
               ROUND(AVG(risk_score),1) AS avg_risk
        FROM portfolio GROUP BY segment ORDER BY delinq_pct DESC
    """).fetchdf()

@st.cache_data
def load_risk_scores():
    conn = get_conn()
    return conn.execute('SELECT risk_score, segment FROM portfolio').fetchdf()

seg = load_segment_data()
risk_data = load_risk_scores()

# ── DELINQUENCY BY SEGMENT ───────────────────────────────────
seg = conn.execute("""
    SELECT segment,
           COUNT(*) AS customers,
           ROUND(AVG(delinquency_flag) * 100, 2) AS delinq_pct,
           ROUND(AVG(utilization_ratio) * 100, 1) AS util_pct,
           ROUND(AVG(risk_score), 1) AS avg_risk
    FROM portfolio
    GROUP BY segment
    ORDER BY delinq_pct DESC
""").fetchdf()

st.subheader('Delinquency Rate by Segment')
c1, c2 = st.columns(2)

with c1:
    fig = px.bar(seg, x='segment', y='delinq_pct',
                 title='Delinquency % by Segment',
                 color='delinq_pct', color_continuous_scale='Reds')
    st.plotly_chart(fig, use_container_width=True)

with c2:
    fig = px.scatter(seg, x='util_pct', y='delinq_pct', text='segment',
                     title='Utilization vs Delinquency',
                     labels={'util_pct':'Avg Utilization %', 'delinq_pct':'Delinquency %'})
    fig.update_traces(textposition='top center')
    st.plotly_chart(fig, use_container_width=True)

# ── RISK SCORE DISTRIBUTION ──────────────────────────────────
st.subheader('Risk Score Distribution by Segment')
risk_data = conn.execute('SELECT risk_score, segment FROM portfolio').fetchdf()
fig = px.histogram(risk_data, x='risk_score', color='segment',
                   nbins=50, barmode='overlay', opacity=0.7,
                   title='Risk Score Distribution')
st.plotly_chart(fig, use_container_width=True)

# ── RAW SEGMENT TABLE ────────────────────────────────────────
st.subheader('Segment Summary Table')
st.dataframe(seg, use_container_width=True)