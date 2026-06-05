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

![Status](https://img.shields.io/badge/Status-Phases%201--7%20Complete-green?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF6B35?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-RF%20%7C%20SHAP-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-RAG-6C3483?style=for-the-badge)
![Streamlit](https://img.shields.io/badge/Streamlit-UI-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)

<br/>

<!-- ![Demo](demo.gif) -->
<!-- Uncomment the line above after recording your demo GIF in Phase 8 -->

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
| **Analytics Agent** | Credit portfolio data | Runs DuckDB SQL queries against 750K+ rows, generates LLM-narrated summaries |
| **Risk / Fraud Agent** | Risk scoring & fraud signals | Rule scoring + Random Forest (AUC 0.87) + SHAP explanations + login anomaly detection |
| **Policy / RAG Agent** | Internal compliance docs | Semantic retrieval from 6 policy documents via ChromaDB with inline citations |

A user can ask things like:

```
"Which segments have the highest delinquency rate and what's driving it?"

"Investigate customer CUST_004821 — summarize their fraud risk and what action to take."

"What does policy say about credit line increases for customers with a risk score above 60?"

"Customer CUST_000042 has a high risk score — what action does policy recommend?"
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
Runs real SQL against the synthetic portfolio and transaction data using DuckDB. Core queries include:
- Delinquency rate by segment (Subprime: 17.6%, Standard: 4.4%, Premium: 4.6%, etc.)
- Cross-border transaction summary with volume and largest single transaction per segment
- All results passed to GPT-4o-mini for a 2-3 paragraph analyst-grade narrative summary

### 3. Risk / Fraud Agent
Two-layer scoring pipeline:
- **Layer 1 — Rule engine:** Fast, deterministic, always runs. Seven rules contribute to a 0–100 score.
- **Layer 2 — ML model:** Random Forest trained on 150K real GMSC records. Returns a probability (0.0–1.0) plus a SHAP breakdown of the top 3 contributing features.
- **Combined score:** 50% rule score + 50% ML probability × 100.

### 4. Policy / RAG Agent
Full retrieval-augmented generation pipeline:
- Embeds the query using `sentence-transformers/all-MiniLM-L6-v2` (local, no API cost)
- Retrieves the top-3 most relevant policy chunks from ChromaDB
- For `mixed` queries: receives upstream agent outputs (risk score, flags) as additional context
- GPT-4o-mini generates a cited answer referencing specific policy sections

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
Real card portfolio data is protected under PCI-DSS and is never publicly available. Rather than using uncalibrated random data, the synthetic tables are generated to match the distributions observed in the [Give Me Some Credit](https://www.kaggle.com/competitions/GiveMeSomeCredit) (150K records) Kaggle dataset. Delinquency rates, utilization distributions, charge-off timing, and login anomaly rates all match empirical real-world benchmarks.

### Portfolio Table — 50,000 customers

| Column | Distribution | Notes |
|---|---|---|
| `customer_id` | Sequential `CUST_XXXXXX` | PII target for masking |
| `segment` | 5 segments, weighted | Standard 40%, Subprime 20%, New_To_Credit 15%, High_Value 15%, Premium 10% |
| `product_type` | Segment-specific | PRODUCT_MAP ensures Subprime can't get Signature cards |
| `credit_limit` | Normal, segment-driven | Premium μ=$15K, Standard μ=$7.5K, Subprime μ=$3K, floor $500 |
| `utilization_ratio` | Beta(2, 5), Subprime Beta(5, 2) | Right-skewed; Subprime elevated — matches real GMSC Cell 4 |
| `delinquency_flag` | Segment-specific | ~7.0% overall; Subprime 18%, others 4.2% |
| `risk_score` | Composite 0–100 | delinquency×35 + utilization×40 + noise(±8) |
| `monthly_income` | Log-normal, segment-driven | High_Value μ=$9.9K, Subprime μ=$3K |
| `months_since_last_delinquency` | Conditional | 1–24 for delinquent customers, 0 otherwise |
| `open_date` | Uniform, last 5 years | Drives cohort analysis |

### Transactions Table — 500,000 rows

| Column | Notes |
|---|---|
| `avg_spend_30d` | Log-normal, proportional to credit limit |
| `max_txn_amt_30d` | 1.5–8× avg_spend — large transaction spike detection |
| `merchant_category` | Cash_Advance weighted 10× higher for utilization > 0.8 — realistic distress signal |
| `country` | 85% US / 15% cross-border (UK, CA, DE, FR, MX, IN, CN, etc.) |
| `charge_off_flag` | ~1.2% rate — 18% of delinquent accounts charge off |

### Login Events Table — 200,000 rows

| Column | Notes |
|---|---|
| `failed_attempts_24h` | Normal: 0–5 (mostly 0); Anomalous: 3–10 |
| `new_device_flag` | 8% base rate; 100% of anomalous sessions |
| `ip_country` | 80% US; anomalous sessions forced to RU/CN/NG/BR |
| `login_success` | Anomalous sessions: 40% success rate; Normal: ~100% |

<br/>

---

## 🤖 ML Risk Model

### Architecture
Two-layer hybrid scoring combining rule-based heuristics and a probabilistic ML classifier.

**Rule-Based Layer (always runs):**

| Rule | Condition | Score |
|---|---|---|
| High utilization | `utilization_ratio > 0.85` | +20 pts |
| Elevated utilization | `utilization_ratio > 0.70` | +10 pts |
| Active delinquency | `delinquency_flag = 1` | +30 pts |
| Recent charge-off | `charge_off_flag = 1` | +35 pts |
| Large transaction spike | `max_txn > avg_spend × 4` | +12 pts |
| Cross-border activity | `is_cross_border = 1` | +8 pts |
| Login anomaly (full) | new device + `fails ≥ 3` | +25 pts |
| Login anomaly (partial) | `fails ≥ 3` only | +12 pts |

**ML Layer:**
```
Training Data:    Give Me Some Credit — 150,000 real labeled records
Model:            Random Forest, 200 trees, max_depth=12, class_weight=balanced
Final Score:      50% rule score + 50% ML probability × 100

───────────────────────────────────────────────────────────
  Metric                        Score
───────────────────────────────────────────────────────────
  AUC-ROC (test set)             0.8664
  5-Fold CV AUC                  0.8590 ± 0.0044
  KS Statistic                   0.5745
  Precision @ Top 10%            0.3650
  Lift @ Top 10%                 ~5.5×
  Baseline delinquency rate      0.0668 (6.68%)
───────────────────────────────────────────────────────────
```

*All metrics are from a real train/test split on real labeled data — not synthetic benchmarks. The tight CV standard deviation (0.0044) and minimal test-CV gap (0.0074) confirm the model is stable and not overfit.*

### SHAP Explainability

Every prediction returns a plain-English breakdown of the top 3 contributing features via `TreeExplainer`:

```
Customer CUST_029679: combined risk score 65.7 (rule=45, ml=86.5%)
Key drivers:
  times_90d_late     increases risk   (+0.305 SHAP)
  past_due_60_89     increases risk   (+0.140 SHAP)
  utilization        decreases risk   (−0.106 SHAP)
Flags: HIGH_UTILIZATION, DELINQUENT
```

This is real SHAP via `TreeExplainer` — not templated text — meaning every customer gets a prediction-specific explanation.

<br/>

---

## 📚 RAG Pipeline

### Knowledge Base
Six policy documents written in realistic internal-policy style with specific numbers, thresholds, and SLAs:

| Document | Key Contents |
|---|---|
| `cross_border_risk_policy.md` | Level 1/2/3 escalation at 150%/200%/200%+new-device thresholds, $1,000 72-hour limit |
| `credit_line_increase_guidelines.md` | Risk score tiers: 0-25 (50% increase), 26-35 (30%), 36-44 (15%), 45+ (ineligible) |
| `login_security_best_practices.md` | Yellow/Orange/Red alerts at 3-4/5-7/8+ failed attempts, MFA triggers, device trust |
| `incident_response_playbook.md` | P0-P3 severity definitions, 15min/1hr/4hr/48hr response SLAs, RACI matrix |
| `delinquency_collections_policy.md` | 30/60/90/120/180 DPD stages, settlement offers 40-70% by segment, charge-off at 180 DPD |
| `new_customer_risk_guidelines.md` | First-90-day caps: Premium $5K/txn, Subprime $1.5K/txn, New_To_Credit no cash advance |

### Pipeline

```
User query
    → Embed:    sentence-transformers/all-MiniLM-L6-v2  (local, no API cost)
    → Retrieve: top-3 chunks by cosine similarity from ChromaDB (12 total chunks)
    → Augment:  upstream agent outputs injected as context (for mixed queries)
    → Generate: GPT-4o-mini produces answer with [SOURCE N] citations
    → Return:   { answer, sources: ["cross_border_risk_policy", ...] }
```

Chunk size: 400 words with 50-word overlap. 12 total chunks across 6 documents.

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
workflow_id | timestamp | intent | user_role | tools_used | risk_flags | latency_ms | has_customer
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
| **Explainability** | SHAP `TreeExplainer` | Exact per-prediction attribution for tree models — mathematically correct |
| **Embeddings** | sentence-transformers/all-MiniLM-L6-v2 | Runs fully locally — no API calls or cost for RAG retrieval |
| **Vector Store** | ChromaDB 0.4.24 | Persistent to disk, pre-built Windows wheels, no C++ compiler needed |
| **Backend** | FastAPI + Uvicorn | Async, auto-generates Swagger docs at `/docs`, production-standard |
| **Frontend** | Streamlit | Multi-page chat UI with session state, agent trace expander |
| **Visualizations** | Plotly | Interactive charts for the analytics dashboard page |

<br/>

---

## 📁 Project Structure

```
Risk-Copilot/
│
├── data/
│   ├── raw/                         ← Downloaded GMSC dataset (gitignored)
│   ├── synthetic/                   ← Generated .parquet files (gitignored)
│   └── processed/
│
├── policies/                        ← Six internal policy documents
│   ├── cross_border_risk_policy.md
│   ├── credit_line_increase_guidelines.md
│   ├── login_security_best_practices.md
│   ├── incident_response_playbook.md
│   ├── delinquency_collections_policy.md
│   └── new_customer_risk_guidelines.md
│
├── src/
│   ├── state.py                     ← AgentState TypedDict — shared memory
│   ├── graph.py                     ← LangGraph wiring + conditional routing
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
│   │   └── logging_node.py          ← CSV audit log writer
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
│   ├── 01_real_data_eda.ipynb       ← EDA on real GMSC data + distribution analysis
│   └── 02_risk_model_training.ipynb ← Full training pipeline, metrics, SHAP plots
│
├── tests/
│   ├── test_risk_agent.py           ← Unit tests: rule scoring logic
│   ├── test_policy_agent.py         ← Unit tests: RAG retrieval quality
│   └── test_graph.py                ← Integration tests: full graph routing
│
├── logs/
│   └── audit_log.csv                ← Per-request audit trail (auto-generated)
│
├── .env                             ← API keys — never committed
├── .gitignore
├── requirements.txt
└── README.md
```

<br/>

---

## ✅ Build Progress

The project is built in 8 sequential phases. Each phase produces a working, testable artifact before the next begins.

```
Phase 0  ██████████  COMPLETE     Software installation, Python 3.11 venv setup
Phase 1  ██████████  COMPLETE     Repo structure, requirements.txt (numpy<2), .env, .gitignore
Phase 2  ██████████  COMPLETE     Synthetic data generator (750K rows), DuckDB loader, real data EDA
Phase 3  ██████████  COMPLETE     Policy documents, ChromaDB ingestion (12 chunks), RAG pipeline
Phase 4  ██████████  COMPLETE     ML model training (AUC 0.87), SHAP explainer, risk + analytics agents
Phase 5  ██████████  COMPLETE     LangGraph AgentState, orchestrator, all nodes, full graph wired
Phase 6  ██████████  COMPLETE     FastAPI backend — /chat, /health, /metrics endpoints
Phase 7  ██████████  COMPLETE     Streamlit chat UI, role selector, agent trace, analytics dashboard
Phase 8  ▓▓▓░░░░░░░  IN PROGRESS  pytest suite, README polish, demo GIF, v1.0.0 tag
```

**What is functional today:**
- Synthetic portfolio, transaction, and login datasets (750K+ rows, calibrated to real GMSC distributions)
- ChromaDB vector store with all 6 policy documents indexed (12 chunks, 578–794 words each)
- Random Forest risk model trained on 150K real records (AUC 0.87, CV-validated at 0.859 ± 0.004)
- LangGraph orchestrator with 4-way intent routing (analytics, risk_fraud, policy, mixed)
- Full agent pipeline: orchestrator → agent(s) → security → logging on every query
- FastAPI REST backend with Swagger UI at `/docs`
- Streamlit chat UI with agent trace expander and analytics dashboard page
- PII masking and role-based access control on every response path
- CSV audit logging with latency tracking

<br/>

---

## ⚙️ Setup & Running

### Prerequisites
- Python 3.11 specifically — **not 3.12 or 3.13** (LangGraph + ChromaDB + NumPy compatibility)
- `numpy<2` in requirements.txt (ChromaDB 0.4.24 requires NumPy 1.x)
- Git with SSH configured
- OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)
- Kaggle account for GMSC dataset download

### Installation

```bash
# 1. Clone
git clone git@github.com:YourUsername/Risk-Copilot.git
cd Risk-Copilot

# 2. Create virtual environment with Python 3.11
py -3.11 -m venv venv
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # macOS / Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file in project root:
#    OPENAI_API_KEY=sk-your-key-here
#    CHROMA_DB_PATH=./chroma_db
#    DATA_PATH=./data/synthetic

# 5. Download GMSC dataset
cd data\raw
kaggle competitions download -c GiveMeSomeCredit
# Unzip to data/raw/GiveMeSomeCredit/

# 6. Generate synthetic datasets
cd ..\..
python src/utils/data_generator.py

# 7. Ingest policy documents into ChromaDB
python -c "from src.agents.policy_agent import ingest_policies; ingest_policies()"

# 8. Train the risk model
#    Run all cells in: notebooks/02_risk_model_training.ipynb
```

### Running the Full Application

```bash
# Terminal 1 — API server (keep running)
.\venv\Scripts\activate
uvicorn src.api.main:app --reload --port 8000

# Terminal 2 — Streamlit UI
.\venv\Scripts\activate
streamlit run src\app.py

# Access points:
#   Chat UI:          http://localhost:8501
#   Analytics page:   http://localhost:8501/analytics_dashboard
#   API docs:         http://localhost:8000/docs
#   Health check:     http://localhost:8000/health
#   Metrics:          http://localhost:8000/metrics
```

### Verifying the Graph

```bash
# Run the 4-query end-to-end test
python -m src.run_test

# Expected: all 4 intents route correctly
# analytics → orchestrator, analytics_agent, security_node, logging_node
# policy    → orchestrator, policy_agent, security_node, logging_node
# risk      → orchestrator, risk_agent, security_node, logging_node
# mixed     → orchestrator, analytics_agent, risk_agent, policy_agent, security_node, logging_node
```

<br/>

---

## 💡 Key Design Decisions

**Why LangGraph over a simple LangChain chain?**
LangChain provides components — LLMs, tools, prompts. LangGraph provides orchestration. This project needed conditional routing (analytics-only queries should never trigger the ML scorer), shared state across agents (the risk agent's output needs to be visible to the policy agent for mixed queries), and the ability to add validation and retry cycles in future iterations. A linear chain cannot express "if intent is mixed, call all three agents in sequence and merge their results." LangGraph's `StateGraph` with conditional edges makes that logic explicit, testable, and auditable.

**Why DuckDB instead of Pandas for analytics?**
DuckDB exposes a full SQL interface on Parquet files with zero infrastructure overhead — no server, no connection pool, no data loading step. The Analytics Agent can run complex multi-table joins in milliseconds. It also makes the analytics layer more maintainable: SQL is readable by any data professional, while deeply nested Pandas code is opaque to anyone who didn't write it.

**Why a hybrid synthetic + real data strategy?**
Real card portfolio data is PCI-DSS protected and unavailable publicly. Purely random synthetic data is statistically meaningless and immediately obvious to any financial services professional. The hybrid approach uses real public datasets to study empirical distributions — delinquency rates, utilization curves, charge-off timing — and generates synthetic data calibrated to those distributions. The ML model is trained on real labeled data, so the AUC-ROC metric (0.87) is genuine rather than self-reported against synthetic labels.

**Why SHAP over standard feature importance?**
Random Forest feature importance tells you which features matter globally across the entire training set. SHAP tells you which features drove *this specific prediction* for *this specific customer*, with direction and magnitude. For a risk investigation tool, per-prediction explainability is the primary value — an analyst needs to know *why this customer was flagged*, not that utilization is generally predictive.

**Why separate Security and Logging nodes instead of embedding them in each agent?**
Separating these as dedicated graph nodes means every query path — regardless of intent — goes through the same masking logic and the same audit writer. If PII masking were embedded in each agent individually, there would be three independent implementations that could diverge over time. One node, one implementation, unconditional execution.

**Why ChromaDB 0.4.24 and NumPy < 2?**
ChromaDB 0.5.x requires C++ Build Tools to compile on Windows. Version 0.4.24 has pre-built wheels that install cleanly. However, 0.4.24 references `np.float_` which was removed in NumPy 2.0. Pinning `numpy<2` in requirements.txt resolves this — all other packages (pandas, scikit-learn, SHAP) work identically on NumPy 1.26.

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

</div>
