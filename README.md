<div align="center">

<br/>

```
██████╗ ██╗███████╗██╗  ██╗     ██████╗ ██████╗ ██████╗ ██╗██╗      ██████╗ ████████╗
██╔══██╗██║██╔════╝██║ ██╔╝    ██╔════╝██╔═══██╗██╔══██╗██║██║     ██╔═══██╗╚══██╔══╝
██████╔╝██║███████╗█████╔╝     ██║     ██║   ██║██████╔╝██║██║     ██║   ██║   ██║   
██╔══██╗██║╚════██║██╔═██╗     ██║     ██║   ██║██╔═══╝ ██║██║     ██║   ██║   ██║   
██║  ██║██║███████║██║  ██╗    ╚██████╗╚██████╔╝██║     ██║███████╗╚██████╔╝   ██║   
╚═╝  ╚═╝╚═╝╚══════╝╚═╝  ╚═╝    ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝ ╚═════╝   ╚═╝   
```

### 🛡️ Agentic Risk & Insights Copilot

**A production-grade, multi-agent AI system for credit risk analytics, fraud detection, and policy-grounded decision support**

*Inspired by the internal risk tooling used at financial institutions like American Express*

<br/>

![Status](https://img.shields.io/badge/Status-Work%20In%20Progress-orange?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF6B35?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-RF%20%7C%20SHAP-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-RAG-6C3483?style=for-the-badge)
![Streamlit](https://img.shields.io/badge/Streamlit-UI-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)

<br/>

> ⚠️ **This repository is under active development.**
> Phases 1–4 are complete. Phases 5–8 (LangGraph orchestration, FastAPI, Streamlit UI, and testing) are in progress.
> This README reflects the full intended architecture — not just what is built today.

<br/>

---

</div>

## 📌 Table of Contents

- [What This Project Is](#-what-this-project-is)
- [The Problem It Solves](#-the-problem-it-solves)
- [Architecture](#-architecture)
- [Agent Design](#-agent-design)
- [Data Layer](#-data-layer)
- [ML Risk Model](#-ml-risk-model)
- [RAG Pipeline](#-rag-pipeline)
- [Security & Governance](#-security--governance)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Build Progress](#-build-progress)
- [Setup & Running](#-setup--running)
- [Key Design Decisions](#-key-design-decisions)
- [What Gets Added in Production](#-what-gets-added-in-production)

<br/>

---

## 🎯 What This Project Is

This is a **LangGraph-powered multi-agent copilot** that lets a risk analyst, fraud investigator, or compliance officer type a plain-English question about a credit card portfolio and receive a data-grounded, policy-cited answer — without writing SQL, querying dashboards, or manually cross-referencing internal documents.

The system orchestrates three specialized AI agents across three distinct problem domains:

| Agent | Domain | What It Does |
|---|---|---|
| **Analytics Agent** | Credit portfolio data | Runs DuckDB SQL queries, computes KPIs, detects trends |
| **Risk / Fraud Agent** | Risk scoring & fraud signals | Rule scoring + trained ML model + SHAP explanations + login anomaly detection |
| **Policy / RAG Agent** | Internal compliance docs | Semantic retrieval from policy documents with inline citations |

A user can ask things like:

```
"Which segments saw delinquency increase in the last 90 days and what's driving it?"

"Investigate customer CUST_004821 — summarize their fraud risk and what action to take."

"What does policy say about credit line increases for customers with a risk score above 60?"

"Flag login anomalies from the last 48 hours and cross-reference with unusual spending."
```

The system classifies the intent, routes through the right combination of agents, runs real data queries and ML inference, retrieves relevant policy documents, applies PII masking, and returns a unified cited response — all in a single interaction.

<br/>

---

## 🧩 The Problem It Solves

Risk and fraud teams at credit card companies sit on enormous amounts of data but face a constant operational bottleneck: **translating business questions into data outputs takes time, requires SQL fluency, and the outputs still need to be manually cross-referenced against internal policy before any action can be taken.**

A typical analyst investigating a suspicious account might need to:

1. Query the portfolio table for the customer's current risk profile
2. Pull transaction history for cross-border spend patterns
3. Check login events for authentication anomalies
4. Run those features through a risk scoring model
5. Look up what the incident response playbook says at this risk level
6. Write up a summary for the case management system

That process takes **30–45 minutes** across multiple tools. This copilot collapses it into a **single natural-language query answered in under 15 seconds** — with the data, the ML score, the SHAP explanation, and the relevant policy section all returned together.

<br/>

---

## 🏗️ Architecture

The system is built as a **directed stateful graph** using LangGraph. Every query flows through a shared `AgentState` object that all nodes read from and write to. The path through the graph is conditional — determined at runtime by the Orchestrator node based on the classified intent of the query.

```
                     ┌──────────────────────────────────┐
                     │           User Query              │
                     │    (Streamlit UI or REST API)     │
                     └───────────────┬──────────────────┘
                                     │
                                     ▼
                     ┌──────────────────────────────────┐
                     │        Orchestrator Node          │
                     │                                   │
                     │  • LLM classifies intent          │
                     │  • Extracts entities from query   │
                     │    (customer_id, segment,         │
                     │     date_range, top_n)            │
                     │  • Routes via conditional edges   │
                     └────┬──────────┬──────────┬───────┘
                          │          │          │
                    [analytics] [risk_fraud] [policy]
                          │          │          │     [mixed → all three]
                          ▼          ▼          ▼
           ┌──────────────┐ ┌────────────┐ ┌────────────────┐
           │  Analytics   │ │ Risk/Fraud │ │  Policy / RAG  │
           │    Agent     │ │   Agent    │ │     Agent      │
           │              │ │            │ │                │
           │ DuckDB SQL   │ │ Rule score │ │ ChromaDB       │
           │ Trend KPIs   │ │ RF Model   │ │ semantic search│
           │ Segment data │ │ SHAP vals  │ │ Policy chunks  │
           │ LLM summary  │ │ Login flags│ │ Cited answers  │
           └──────┬───────┘ └─────┬──────┘ └──────┬─────────┘
                  └───────────────┴────────────────┘
                                  │
                                  ▼
                     ┌──────────────────────────────────┐
                     │      Security / PII Node          │
                     │                                   │
                     │  • Regex masking on all IDs       │
                     │  • Role-based access control      │
                     │  • Runs on EVERY response path    │
                     └───────────────┬──────────────────┘
                                     │
                                     ▼
                     ┌──────────────────────────────────┐
                     │       Logging / Telemetry         │
                     │                                   │
                     │  • Writes to audit_log.csv        │
                     │  • Records intent, agents used,   │
                     │    latency, risk flags raised      │
                     └───────────────┬──────────────────┘
                                     │
                                     ▼
                     ┌──────────────────────────────────┐
                     │       Response Returned           │
                     │  (to UI or API client)            │
                     └──────────────────────────────────┘
```

### Routing by Intent

| Intent | Agent Path | Triggered By |
|---|---|---|
| `analytics` | Orchestrator → Analytics → Security → Log | Portfolio, segment, trend, KPI questions |
| `risk_fraud` | Orchestrator → Risk/Fraud → Security → Log | Customer investigations, fraud, anomaly queries |
| `policy` | Orchestrator → Policy/RAG → Security → Log | Policy, guideline, procedure questions |
| `mixed` | Orchestrator → Analytics → Risk → Policy → Security → Log | Combined data + policy questions |

<br/>

---

## 🤖 Agent Design

### 1. Orchestrator Node
The first node on every query. Makes a single LLM call at `temperature=0` to:
- Classify the user's intent into one of four categories
- Extract entities: `customer_id`, `segment`, `date_range_days`, `top_n`
- Return structured JSON that updates the shared `AgentState`

This is deterministic by design — using `temperature=0` ensures consistent routing behavior that can be tested and audited.

### 2. Analytics Agent
Runs real SQL against the synthetic portfolio and transaction data using DuckDB. Key queries include:
- Delinquency rate by segment with configurable time windows
- Top-N customers by risk score, optionally filtered by segment
- Early-warning pattern: customers with high utilization but no delinquency yet
- Cross-border spend spike detection (spend > 2× 30-day average)

Results are passed to an LLM call that generates a 3–4 sentence narrative summary with specific numbers and flags.

### 3. Risk / Fraud Agent
Two-layer scoring pipeline:
- **Layer 1 — Rule engine:** Fast, deterministic, always runs. Six rules contribute to a 0–100 score.
- **Layer 2 — ML model:** Random Forest trained on 150K real records. Returns a probability (0.0–1.0) plus a SHAP breakdown of the top 3 contributing features.

Also runs a login anomaly detector against the authentication event table — scoring accounts by combinations of new device, foreign IP, and failed attempt velocity.

### 4. Policy / RAG Agent
Full retrieval-augmented generation pipeline:
- Receives the user query (plus any analytics/risk context from upstream agents if the intent is `mixed`)
- Embeds the query using `sentence-transformers/all-MiniLM-L6-v2`
- Retrieves the top-3 most relevant policy chunks from ChromaDB
- Passes retrieved chunks + context to GPT-4o-mini for a cited answer

The key feature for `mixed` queries: the policy agent receives upstream agent outputs as additional context, enabling it to return a *specific* policy recommendation rather than a generic one.

### 5. Security Node
Runs unconditionally on every response path. Applies:
- Regex-based PII masking: customer IDs (`CUST_****`), card numbers, email addresses
- Role enforcement: `read_only` users receive only text summaries — raw data tables are stripped

### 6. Logging Node
Appends one row to `logs/audit_log.csv` per query:
```
workflow_id | timestamp | intent | user_role | tools_used | risk_flags | latency_ms
```

<br/>

---

## 📊 Data Layer

Three synthetic tables — 750,000+ total rows — calibrated to match the statistical distributions of real publicly available credit datasets.

### Why Synthetic?
Real card portfolio data is protected under PCI-DSS and is never publicly available. Rather than using uncalibrated random data, the synthetic tables are generated to match the distributions observed in the [Give Me Some Credit](https://www.kaggle.com/competitions/GiveMeSomeCredit) (150K records) and [Amex Default Prediction](https://www.kaggle.com/competitions/amex-default-prediction) Kaggle datasets. Delinquency rates, utilization distributions, charge-off timing, and login anomaly rates all match empirical real-world benchmarks.

### Portfolio Table — 50,000 customers

| Column | Distribution | Notes |
|---|---|---|
| `customer_id` | Sequential `CUST_XXXXXX` | PII target for masking |
| `segment` | 6 segments, weighted | Mass_Market 35%, Premium 20%, Small_Business 15%, New_To_Credit 10%, High_Value 10%, Near_Prime 10% |
| `credit_limit` | Log-normal | $500–$100,000 |
| `utilization_ratio` | Beta(0.8, 2.5) | Right-skewed — most customers below 0.4 |
| `delinquency_flag` | Segment-specific | 6.7% overall; Near_Prime 12%, High_Value 1.5% |
| `risk_score` | Composite 0–100 | Derived from utilization + delinquency + product + noise |
| `open_date` | Uniform, last 5 years | Drives cohort analysis |

### Transactions Table — 500,000 rows

| Column | Notes |
|---|---|
| `avg_spend_30d` | Log-normal, scaled by credit limit |
| `max_txn_amt_30d` | Large transaction spike detection |
| `merchant_category` | Cash_Advance weighted higher for high-utilization customers — realistic distress signal |
| `country` | 85% US / 15% cross-border |
| `charge_off_flag` | ~1.9% rate — always lower than delinquency, 45–60 day realistic lag |

### Login Events Table — 200,000 rows

| Column | Notes |
|---|---|
| `failed_attempts_24h` | Poisson-distributed; anomalous sessions inject 3–8 |
| `new_device_flag` | 5% of sessions; 100% of anomalous sessions |
| `ip_country` | 90% US; anomalous sessions always foreign |
| `is_anomalous` | Ground truth label — 0.5% rate |

<br/>

---

## 🤖 ML Risk Model

### Architecture
Two-layer hybrid scoring combining rule-based heuristics and a probabilistic ML classifier.

**Rule-Based Layer (always runs):**

| Rule | Condition | Score |
|---|---|---|
| High utilization | `utilization_ratio > 0.85` | +20 pts |
| Active delinquency | `delinquency_flag = 1` | +30 pts |
| Recent charge-off | `charge_off_flag = 1` | +35 pts |
| Large transaction spike | `max_txn > avg_spend × 4` | +12 pts |
| Cross-border activity | `is_cross_border = 1` | +8 pts |
| Login anomaly (full) | new device + foreign IP + `fails ≥ 3` | +25 pts |
| Login anomaly (partial) | `fails ≥ 3` only | +12 pts |

**ML Layer:**
```
Training Data:    Give Me Some Credit — 150,000 real labeled records
Model:            Random Forest, 200 trees, max_depth=8
Class Imbalance:  SMOTE oversampling
Final Score:      50% rule score + 50% ML probability × 100

───────────────────────────────────────────
  Metric                        Score
───────────────────────────────────────────
  AUC-ROC                       ~0.79
  KS Statistic                  ~0.44
  Precision @ Top 10%           ~0.25
  Lift @ Top 10%                ~3.7×
  Baseline (random)              0.067
───────────────────────────────────────────
```

*All metrics are from a real train/test split on real labeled data — not synthetic benchmarks.*

### SHAP Explainability

Every prediction returns a plain-English breakdown of the top 3 contributing features:

```
Risk Level: HIGH  |  Combined Score: 67  |  ML Probability: 71%

Top risk drivers:
  utilization_ratio     increases risk   (+0.31 SHAP)
  times_90d_late        increases risk   (+0.18 SHAP)
  monthly_income        decreases risk   (−0.09 SHAP)
```

This is real SHAP via `TreeExplainer` — not templated text — meaning every customer gets a prediction-specific explanation.

<br/>

---

## 📚 RAG Pipeline

### Knowledge Base
Six synthetic policy documents written in realistic internal-policy style, covering the key decision scenarios a risk analyst would face:

| Document | Key Contents |
|---|---|
| `cross_border_risk_policy.md` | Escalation thresholds, Level 1/2/3 response procedures, customer notification requirements |
| `credit_line_increase_guidelines.md` | Eligibility by risk score, increase amount limits, segment-specific exceptions |
| `login_security_best_practices.md` | MFA requirements, device trust policy, anomaly response SLAs |
| `incident_response_playbook.md` | Fraud confirmation steps, account freeze criteria, P0/P1/P2 definitions |
| `delinquency_collections_policy.md` | DPD stages (30/60/90/120+), intervention types, charge-off timing at 180 DPD |
| `new_customer_risk_guidelines.md` | First-90-day spending limits, velocity controls, monitoring frequency by segment |

### Pipeline

```
User query
    → Embed:    sentence-transformers/all-MiniLM-L6-v2  (local, no API cost)
    → Retrieve: top-3 chunks by cosine similarity from ChromaDB
    → Augment:  upstream agent outputs injected as context (for mixed queries)
    → Generate: GPT-4o-mini produces answer with inline citations
    → Return:   { answer, citations: [{ source, relevance_score }] }
```

Chunk size: 400 words with 50-word overlap to preserve section context across boundaries.

<br/>

---

## 🔒 Security & Governance

### PII Masking
Runs unconditionally on every response before it reaches the frontend. Pattern-matches and replaces:
- Customer IDs: `CUST_004821` → `CUST_****`
- Card numbers: 15–16 digit sequences → `[CARD-MASKED]`
- Email addresses → `[EMAIL-MASKED]`

### Role-Based Access Control

| Role | Access Level |
|---|---|
| `analyst` | Full responses — raw data tables, customer details, ML scores, SHAP breakdowns |
| `manager` | Same as analyst |
| `read_only` | Text summaries only — raw analytics tables stripped before response is returned |

### Audit Logging
Every query writes a row to `logs/audit_log.csv`:
```
workflow_id | timestamp | intent | user_role | tools_used | risk_flags | latency_ms | has_customer_query
```

Aggregate metrics exposed at `GET /metrics` — queryable without accessing raw logs.

<br/>

---

## 🛠️ Tech Stack

| Layer | Technology | Reason for Choice |
|---|---|---|
| **Orchestration** | LangGraph `StateGraph` | Stateful graph with conditional routing — not possible with linear LangChain chains |
| **LLM** | GPT-4o-mini | Reliable structured JSON outputs for intent classification; ~$0.80 total project cost |
| **Data** | DuckDB + Parquet | In-process SQL on flat files — zero infrastructure, fast columnar queries |
| **ML Model** | Scikit-learn Random Forest | Interpretable, fast inference, native SHAP `TreeExplainer` support |
| **Explainability** | SHAP `TreeExplainer` | Exact attribution for tree models — mathematically correct, not approximations |
| **Embeddings** | sentence-transformers/all-MiniLM-L6-v2 | Runs fully locally — no API calls or cost for RAG retrieval |
| **Vector Store** | ChromaDB | Persistent to disk, simple setup, no separate server process |
| **Backend** | FastAPI + Uvicorn | Async, auto-generates Swagger docs at `/docs`, production-standard |
| **Frontend** | Streamlit | Multi-page chat UI with session state, rapid iteration |
| **Visualizations** | Plotly | Interactive charts for the analytics dashboard page |
| **Class Imbalance** | SMOTE (imbalanced-learn) | Synthetic minority oversampling — handles the 6.7% positive class rate in training data |

<br/>

---

## 📁 Project Structure

```
amex-risk-copilot/
│
├── data/
│   ├── raw/                         ← Downloaded Kaggle datasets (gitignored)
│   ├── synthetic/                   ← Generated .parquet files (gitignored)
│   └── processed/                   ← Cleaned data for ML training
│
├── policies/                        ← Six synthetic internal policy documents
│   ├── cross_border_risk_policy.md
│   ├── credit_line_increase_guidelines.md
│   ├── login_security_best_practices.md
│   ├── incident_response_playbook.md
│   ├── delinquency_collections_policy.md
│   └── new_customer_risk_guidelines.md
│
├── src/
│   ├── state.py                     ← AgentState TypedDict — shared memory
│   ├── graph.py                     ← LangGraph wiring + routing logic
│   ├── run_test.py                  ← End-to-end graph verification script
│   │
│   ├── agents/
│   │   ├── analytics_agent.py       ← DuckDB queries + LLM summarization
│   │   ├── risk_agent.py            ← Rule scoring + RF + SHAP + anomaly detection
│   │   └── policy_agent.py          ← ChromaDB ingestion + retrieval + RAG
│   │
│   ├── nodes/
│   │   ├── orchestrator.py          ← Intent classification + entity extraction
│   │   ├── analytics_node.py        ← LangGraph wrapper for analytics_agent
│   │   ├── risk_node.py             ← LangGraph wrapper for risk_agent
│   │   ├── policy_node.py           ← LangGraph wrapper for policy_agent
│   │   ├── security.py              ← PII masking + RBAC enforcement
│   │   └── logging_node.py          ← Audit log writer
│   │
│   ├── api/
│   │   └── main.py                  ← FastAPI: /chat, /health, /metrics
│   │
│   ├── utils/
│   │   ├── data_generator.py        ← Calibrated synthetic data generator
│   │   └── db.py                    ← DuckDB connection + query runner
│   │
│   ├── app.py                       ← Streamlit chat interface
│   └── pages/
│       └── analytics_dashboard.py   ← Portfolio analytics visualization page
│
├── models/
│   ├── risk_rf_model.pkl            ← Trained Random Forest (gitignored)
│   ├── feature_names.pkl
│   └── shap_explainer.pkl
│
├── notebooks/
│   ├── 01_real_data_eda.ipynb       ← EDA on real Kaggle data + distribution analysis
│   └── 02_risk_model_training.ipynb ← Full training pipeline, metrics, SHAP plots
│
├── tests/
│   ├── test_risk_agent.py           ← Unit tests: rule scoring logic
│   ├── test_policy_agent.py         ← Unit tests: RAG retrieval
│   └── test_graph.py                ← Integration tests: full graph routing
│
├── logs/
│   └── audit_log.csv                ← Per-request audit trail (auto-generated)
│
├── .env                             ← API keys — never committed
├── .gitignore
├── requirements.txt
├── docker-compose.yml               ← Postgres for production persistence
└── README.md
```

<br/>

---

## ✅ Build Progress

The project is built in 8 sequential phases. Each phase produces a working, testable artifact before the next begins.

```
Phase 0  ██████████  COMPLETE     Software installation, SSH, GitHub setup
Phase 1  ██████████  COMPLETE     Repo structure, virtual environment, all dependencies
Phase 2  ██████████  COMPLETE     Synthetic data generator, DuckDB loader, real data EDA
Phase 3  ██████████  COMPLETE     Policy documents, ChromaDB ingestion, RAG pipeline
Phase 4  ██████████  COMPLETE     ML model training (AUC 0.79), SHAP, analytics + risk agents
Phase 5  ▓▓▓░░░░░░░  IN PROGRESS  LangGraph state, orchestrator, full graph wiring
Phase 6  ░░░░░░░░░░  PENDING      FastAPI backend — /chat, /health, /metrics endpoints
Phase 7  ░░░░░░░░░░  PENDING      Streamlit chat UI, role selector, analytics dashboard
Phase 8  ░░░░░░░░░░  PENDING      pytest suite, README polish, demo GIF, v1.0.0 tag
```

**What is already functional:**
- Synthetic portfolio, transaction, and login datasets (750K+ rows, calibrated distributions)
- ChromaDB vector store with all 6 policy documents indexed and retrievable
- Random Forest risk model trained on 150K real records with SHAP explainability
- Standalone analytics agent with 5 core DuckDB query functions
- Standalone risk agent with rule scoring + ML inference + login anomaly detection
- Standalone RAG pipeline with policy retrieval and inline citations

**What is being built next:**
- LangGraph `StateGraph` wiring all agents with conditional routing
- FastAPI REST backend exposing the graph as HTTP endpoints
- Streamlit conversational UI with agent trace visibility and analytics dashboard

<br/>

---

## ⚙️ Setup & Running

> ⚠️ Full setup instructions will be finalized at Phase 8. The following covers getting the current working components running locally.

### Prerequisites
- Python 3.11 specifically — LangGraph has compatibility issues with 3.12+
- Git with SSH configured
- OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)
- Kaggle account for dataset downloads

### Installation

```bash
# 1. Clone
git clone git@github.com:YourUsername/amex-risk-copilot.git
cd amex-risk-copilot

# 2. Create virtual environment with Python 3.11
python -m venv venv
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # macOS / Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file in project root:
#    OPENAI_API_KEY=sk-your-key-here
#    CHROMA_DB_PATH=./chroma_db
#    DATA_PATH=./data/synthetic

# 5. Generate synthetic datasets
python src/utils/data_generator.py

# 6. Ingest policy documents into ChromaDB
python -c "from src.agents.policy_agent import ingest_policies; ingest_policies()"

# 7. Train the risk model
#    Download: kaggle competitions download -c GiveMeSomeCredit
#    Then run all cells in: notebooks/02_risk_model_training.ipynb
```

### Testing What Is Built So Far

```bash
# Analytics agent
python -c "
from src.agents.analytics_agent import get_delinquency_by_segment
for r in get_delinquency_by_segment(): print(r)
"

# Risk agent
python -c "
from src.agents.risk_agent import score_customer
print(score_customer('CUST_000001'))
"

# RAG pipeline
python -c "
from src.agents.policy_agent import answer_policy_question
result = answer_policy_question('What are the escalation steps for cross-border transactions?')
print(result['answer'])
print('Citations:', result['citations'])
"
```

### Running the Full Application *(available after Phase 6–7)*

```bash
# Terminal 1 — API server
uvicorn src.api.main:app --reload --port 8000

# Terminal 2 — Streamlit UI
streamlit run src/app.py

# UI:          http://localhost:8501
# API docs:    http://localhost:8000/docs
# Metrics:     http://localhost:8000/metrics
```

<br/>

---

## 💡 Key Design Decisions

**Why LangGraph over a simple LangChain chain?**
LangChain provides components — LLMs, tools, prompts. LangGraph provides orchestration. This project needed conditional routing (analytics-only queries should never trigger the ML scorer), shared state across agents (the risk agent's output needs to be visible to the policy agent for mixed queries), and the ability to add validation and retry cycles in future iterations. A linear chain cannot express "if intent is mixed, call all three agents in sequence and merge their results." LangGraph's `StateGraph` with conditional edges makes that logic explicit, testable, and auditable.

**Why DuckDB instead of Pandas for analytics?**
DuckDB exposes a full SQL interface on Parquet files with zero infrastructure overhead — no server, no connection pool, no data loading step. The Analytics Agent can run complex multi-table joins in milliseconds. It also makes the analytics layer more maintainable: SQL is readable by any data professional, while deeply nested Pandas code is opaque to anyone who didn't write it.

**Why a hybrid synthetic + real data strategy?**
Real card portfolio data is PCI-DSS protected and unavailable publicly. Purely random synthetic data is statistically meaningless and immediately obvious to any financial services professional. The hybrid approach uses real public datasets to study empirical distributions — delinquency rates, utilization curves, charge-off timing — and generates synthetic data calibrated to those distributions. The ML model is trained on real labeled data, so the AUC-ROC metric is genuine rather than self-reported against synthetic labels.

**Why SHAP over standard feature importance?**
Random Forest feature importance tells you which features matter globally across the entire training set. SHAP tells you which features drove *this specific prediction* for *this specific customer*, with direction and magnitude. For a risk investigation tool, per-prediction explainability is the primary value — an analyst needs to know *why this customer was flagged*, not that utilization is generally predictive.

**Why separate Security and Logging nodes instead of embedding them in each agent?**
Separating these as dedicated graph nodes means every query path — regardless of intent — goes through the same masking logic and the same audit writer. If PII masking were embedded in each agent individually, there would be three independent implementations that could diverge over time. One node, one implementation, unconditional execution.

<br/>

---

## 🔮 What Gets Added in Production

This project is a portfolio demonstration and local development tool. A real deployment at a financial institution would require:

- **PGVector** replacing ChromaDB — one Postgres instance for all persistence, ACID-compliant, simpler to operate at scale
- **LangGraph Postgres checkpointer** — workflows survive server restarts; long-running investigations can span multiple sessions
- **JWT authentication** on all API endpoints — current `user_role` is self-declared in the request body; in production it would be validated from a signed token issued by an identity provider
- **LangSmith tracing** — visual per-node trace with token counts and latency per step; essential for debugging agent failures in a team environment
- **Redis caching** for RAG queries — repeated policy questions hit cache rather than making embedding API calls; meaningful cost and latency reduction at scale
- **Model retraining pipeline** with MLflow for artifact versioning, experiment tracking, and production deployment management
- **Survival analysis** alongside the binary classifier — time-to-default modelling gives richer risk horizon estimates than a binary prediction
- **Docker Compose** for the full stack — reproducible environment from a single command
- **PCI-DSS compliance review** before any real cardholder data is introduced into the system

<br/>

---

<div align="center">

**Built to demonstrate production-grade agentic AI applied to a real financial services domain**

*LangGraph · Multi-Agent Orchestration · Explainable ML · RAG · FastAPI · Risk Analytics*

<br/>

![Visitors](https://img.shields.io/badge/Status-Building-blue?style=flat-square)

</div>
