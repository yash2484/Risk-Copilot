# src/app.py

import streamlit as st
import requests

API_URL = 'http://localhost:8000'

st.set_page_config(
    page_title = 'Risk & Insights Copilot',
    page_icon  = '🛡️',
    layout     = 'wide',
)

# ── SIDEBAR ──────────────────────────────────────────────────
with st.sidebar:
    st.title('Risk Copilot')
    st.markdown('---')

    user_role = st.selectbox(
        'Your Role',
        ['analyst', 'manager', 'read_only'],
        help='Controls data visibility in responses'
    )

    st.markdown('---')
    st.subheader('Example Queries')
    examples = [
        'Show segments with the highest delinquency rate',
        'Investigate customer CUST_000042',
        'What does policy say about credit line increases?',
        'Flag login anomalies from the last 48 hours',
        'Customer CUST_042 has rising utilization — what does policy say?',
        'Show cross-border spending spikes this month',
    ]
    for eq in examples:
        if st.button(eq, use_container_width=True):
            st.session_state.pending = eq

    st.markdown('---')
    st.caption(f'Role: {user_role}')

# ── MAIN AREA ────────────────────────────────────────────────
st.title('Agentic Risk & Insights Copilot')
st.caption('Multi-agent system for credit risk, fraud detection, and policy guidance')

# Initialize session state
if 'messages' not in st.session_state: st.session_state.messages = []
if 'pending'  not in st.session_state: st.session_state.pending  = None

# Render conversation history
for msg in st.session_state.messages:
    with st.chat_message(msg['role']):
        st.markdown(msg['content'])
        if msg.get('trace'):
            with st.expander('🔍 Agent Trace'):
                t = msg['trace']
                c1, c2, c3 = st.columns(3)
                c1.metric('Intent',   t.get('intent', 'N/A'))
                c2.metric('Latency',  f"{t.get('latency_ms', 0):.0f}ms")
                c3.metric('Agents',   len(t.get('tools_used', [])))
                st.write('Pipeline:', ' → '.join(t.get('tools_used', [])))
                if t.get('risk_flags'):
                    st.warning('Risk flags: ' + ' | '.join(t['risk_flags']))

# Handle user input — either from chat box or sidebar example button
user_input = st.chat_input('Ask about risk, fraud, analytics, or policy...')
if st.session_state.pending:
    user_input = st.session_state.pending
    st.session_state.pending = None

if user_input:
    # Add user message to history
    st.session_state.messages.append({'role': 'user', 'content': user_input})
    with st.chat_message('user'):
        st.markdown(user_input)

    # Call the API and render the assistant response
    with st.chat_message('assistant'):
        with st.spinner('Agents working...'):
            try:
                resp = requests.post(
                    f'{API_URL}/chat',
                    json={'message': user_input, 'user_role': user_role},
                    timeout=60
                )
                data = resp.json()
                text = data.get('response', 'No response.')
                st.markdown(text)

                with st.expander('🔍 Agent Trace'):
                    c1, c2, c3 = st.columns(3)
                    c1.metric('Intent',   data.get('intent', 'N/A'))
                    c2.metric('Latency',  f"{data.get('latency_ms', 0):.0f}ms")
                    c3.metric('Agents',   len(data.get('tools_used', [])))
                    st.write('Pipeline:', ' → '.join(data.get('tools_used', [])))
                    if data.get('risk_flags'):
                        st.warning('Flags: ' + ' | '.join(data['risk_flags']))

                # Save to history so it persists when the page re-renders
                st.session_state.messages.append({
                    'role':    'assistant',
                    'content': text,
                    'trace':   data,
                })
            except Exception as e:
                st.error(f'API error: {e}. Is FastAPI running on port 8000?')

# ── METRICS DASHBOARD (below chat) ───────────────────────────
st.markdown('---')
st.subheader('Session Metrics')
try:
    m = requests.get(f'{API_URL}/metrics', timeout=5).json()
    a, b, c = st.columns(3)
    a.metric('Total Queries', m.get('total_queries', 0))
    b.metric('Avg Latency',   f"{m.get('avg_latency_ms', 0):.0f}ms")
    c.metric('Intent Types',  len(m.get('intent_breakdown', {})))

    if m.get('intent_breakdown'):
        import plotly.express as px
        fig = px.bar(
            x=list(m['intent_breakdown'].keys()),
            y=list(m['intent_breakdown'].values()),
            title='Queries by Intent',
            color_discrete_sequence=['#1D6FA8'],
        )
        st.plotly_chart(fig, use_container_width=True)
except Exception:
    st.info('Run some queries to see metrics here.')