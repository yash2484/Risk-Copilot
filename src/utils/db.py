# src/utils/db.py
# ──────────────────────────────────────────────────────────────────────
# DuckDB query engine for the project.
# Reads Parquet files directly as SQL-queryable views — no database
# server to start, no loading step, no data copying.
    
# DuckDB is embedded in your Python process, starts in milliseconds,
# and handles 50k-row queries in under 10ms.
# ──────────────────────────────────────────────────────────────────────

import duckdb
import os
from pathlib import Path

DATA_PATH = Path(os.getenv("DATA_PATH", "./data/synthetic"))


def get_connection():
    """
    Create an in-memory DuckDB connection with Parquet files
    registered as SQL views.

    A "view" in DuckDB is a named query — when you SELECT from
    "portfolio", DuckDB reads the Parquet file on demand.
    No data is loaded into memory upfront.

    Creates a fresh connection every call. Slightly inefficient but
    eliminates connection state bugs in a multi-threaded FastAPI context.
    For this project's query volume it makes no noticeable difference.
    """
    conn = duckdb.connect()  # In-memory — no .db file needed

    # .resolve() converts relative paths to absolute paths.
    # .as_posix() converts Windows backslashes (C:\Users\...) to
    # forward slashes (C:/Users/...) which DuckDB requires.
    # Without this, DuckDB on Windows throws:
    #   "IO Error: No files found that match the pattern"
    portfolio_path = (DATA_PATH / "portfolio.parquet").resolve().as_posix()
    transactions_path = (DATA_PATH / "transactions.parquet").resolve().as_posix()
    login_events_path = (DATA_PATH / "login_events.parquet").resolve().as_posix()

    conn.execute(f"""
        CREATE OR REPLACE VIEW portfolio AS
        SELECT * FROM read_parquet('{portfolio_path}')
    """)

    conn.execute(f"""
        CREATE OR REPLACE VIEW transactions AS
        SELECT * FROM read_parquet('{transactions_path}')
    """)

    conn.execute(f"""
        CREATE OR REPLACE VIEW login_events AS
        SELECT * FROM read_parquet('{login_events_path}')
    """)

    return conn


def run_query(sql: str) -> list[dict]:
    """
    Execute a SQL query and return results as a list of dicts.
    Each dict is one row: {"column_name": value, ...}

    .fetchdf()  → returns a pandas DataFrame
    .to_dict("records")  → converts to list of row dictionaries
    This format is what LangChain message formatting expects.
    """
    conn = get_connection()
    return conn.execute(sql).fetchdf().to_dict("records")


if __name__ == "__main__":
    # Quick smoke test — verify Parquet files are readable
    print(f"Data path: {DATA_PATH.resolve()}")
    print()

    rows = run_query("""
        SELECT segment,
               COUNT(*) AS n,
               ROUND(AVG(risk_score), 1) AS avg_risk,
               ROUND(AVG(delinquency_flag) * 100, 2) AS delinq_pct
        FROM portfolio
        GROUP BY segment
        ORDER BY avg_risk DESC
    """)
    for r in rows:
        print(r)