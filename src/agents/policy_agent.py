# src/agents/policy_agent.py

# Uncomment these 3 lines ONLY if chromadb import fails:
# __import__("pysqlite3")
# import sys
# sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")

import os
from pathlib import Path
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv

load_dotenv()  # Reads OPENAI_API_KEY from your .env file

CHROMA_PATH    = os.getenv("CHROMA_DB_PATH", "./chroma_db")
POLICIES_PATH  = Path("policies")
COLLECTION     = "risk_policies"
CHUNK_SIZE     = 400   # words per chunk
CHUNK_OVERLAP  = 50    # overlapping words between consecutive chunks

# Load the embedding model once at module import time.
EMBED_MODEL = SentenceTransformer("all-MiniLM-L6-v2")


def chunk_text(text: str) -> list[str]:
    """
    Split a policy document into overlapping word-based chunks.
    Overlap is critical: without it, a policy rule that spans two
    chunk boundaries would be split in half and neither chunk
    would contain the complete rule.
    """
    words, chunks, start = text.split(), [], 0
    while start < len(words):
        chunks.append(" ".join(words[start : start + CHUNK_SIZE]))
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks

def get_client():
    """
    Return a ChromaDB PersistentClient.
    PersistentClient saves embeddings to disk at CHROMA_PATH.
    anonymized_telemetry=False prevents ChromaDB from sending
    usage data to their servers.
    """
    return chromadb.PersistentClient(
        path=CHROMA_PATH,
        settings=Settings(anonymized_telemetry=False)
    )

def ingest_policies():
    client = get_client()
    try:
        client.delete_collection(COLLECTION)
    except Exception:
        pass

    collection = client.create_collection(COLLECTION)
    ids, embeddings, documents, metadatas = [], [], [], []
    chunk_idx = 0

    for policy_file in POLICIES_PATH.glob("*.md"):
        text     = policy_file.read_text(encoding="utf-8")
        doc_name = policy_file.stem
        title    = next(
            (l.strip("# ").strip() for l in text.splitlines() if l.startswith("#")),
            doc_name
        )

        chunks = chunk_text(text)
        print(f"  Ingesting {doc_name}: {len(chunks)} chunks")

        for i, chunk in enumerate(chunks):
            embedding = EMBED_MODEL.encode(chunk).tolist()
            ids.append(f"{doc_name}_chunk_{chunk_idx}")
            embeddings.append(embedding)
            documents.append(chunk)
            metadatas.append({
                "source": doc_name, "title": title,
                "chunk_index": i, "total_chunks": len(chunks),
            })
            chunk_idx += 1

    collection.add(ids=ids, embeddings=embeddings,
                   documents=documents, metadatas=metadatas)
    print(f"Ingestion complete: {chunk_idx} total chunks stored.")

def retrieve_policy(query: str, top_k: int = 3) -> list[dict]:
    client = get_client()
    collection = client.get_collection(COLLECTION)
    query_embedding = EMBED_MODEL.encode(query).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for text, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        chunks.append({
            "text": text, "source": meta["source"],
            "title": meta["title"], "distance": round(dist, 4),
        })
    return chunks

def answer_policy_question(question: str) -> dict:
    chunks = retrieve_policy(question, top_k=3)
    if not chunks:
        return {"answer": "No relevant policy found.", "sources": []}

    context = "\n\n".join([
        f"[SOURCE {i+1}: {c['title']}]\n{c['text']}"
        for i, c in enumerate(chunks)
    ])

    system = (
        "You are a risk policy assistant. Answer the question using ONLY "
        "the provided policy excerpts. Cite sources as [SOURCE N]. "
        "If the excerpts do not contain the answer, say so."
    )
    user = f"Policy Documents:\n{context}\n\nQuestion: {question}"

    llm  = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    resp = llm.invoke([SystemMessage(content=system),
                       HumanMessage(content=user)])

    return {
        "answer":  resp.content,
        "sources": [c["source"] for c in chunks],
    }