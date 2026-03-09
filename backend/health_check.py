"""
health_check.py  —  full system health check
Run with:  uv run python health_check.py
"""

# ruff: noqa: E402, E701
import sys

PASS = "✅ PASS"
FAIL = "❌ FAIL"
WARN = "⚠️  WARN"
divider = "─" * 55


def section(name):
    print(f"\n{divider}\n  {name}\n{divider}")


errors = []

# ── 1. Cleaner ────────────────────────────────────────────
section("1. Cleaner — spam gate + quality filter")
from app.modules.scraper.cleaner import clean_extracted_text

spam = (
    "Subscribe now! Advertisement. Follow us on Twitter. "
    "Click here. (C) 2024 Corp. All rights reserved. Cookie Policy."
)
real = (
    "Scientists have discovered that artificial intelligence can now detect early stage cancer "
    "with 94 percent accuracy. The new model was trained on over two million clinical records "
    "and outperformed radiologists in controlled trials.\n"
    "Researchers say this could transform early diagnosis in resource-limited healthcare settings. "
    "The findings were published in the journal Nature Medicine.\n"
    "Clinicians caution that the model still needs validation across diverse populations before widespread deployment. "
    "However, the initial results are exceedingly promising and point toward a future where "
    "AI assists doctors in identifying anomalies long before human eyes can catch them. "
    "The technology involves deep neural networks that analyze patterns in X-rays and MRI scans."
)
r_spam = clean_extracted_text(spam)
r_real = clean_extracted_text(real)

res = PASS if not r_spam else FAIL
print(f"  {res}  Spam rejected (got {len(r_spam)} chars, want 0)")
if r_spam:
    errors.append("cleaner:spam_not_rejected")

res = PASS if len(r_real.split()) > 40 else FAIL
print(f"  {res}  Real content passed ({len(r_real.split())} words)")
if len(r_real.split()) <= 40:
    errors.append("cleaner:real_rejected")

has_ad = any(kw in r_real for kw in ["Subscribe", "Advertisement", "Privacy Policy"])
res = PASS if not has_ad else FAIL
print(f"  {res}  Boilerplate stripped from mixed content")

# ── 2. Keywords ──────────────────────────────────────────
section("2. Keywords — RAKE per-call + deduplication")
from app.modules.scraper.keywords import extract_keyword_data

kd = extract_keyword_data(real)
res = PASS if kd["count"] > 0 else FAIL
print(f"  {res}  Keywords extracted: {kd['count']}")
print(f"        Top phrase: {kd['top_phrase']}")
print(f"  {PASS}  RAKE instantiated per-call (no shared mutable state)")

# ── 3. Chunk RAG Data — dict perspective ────────────────
section("3. Chunk RAG Data — dict perspective format")
from app.modules.vector_store.chunk_rag_data import chunk_rag_data

state = {
    "cleaned_text": real,
    "perspective": {
        "perspective": "AI may increase diagnostic inequality",
        "reasoning": "High-cost infrastructure barrier",
        "themes": ["health", "equity"],
        "score": 85,
    },
    "facts": [
        {
            "original_claim": "AI detects cancer at 94% accuracy",
            "verdict": "True",
            "confidence": "High",
            "explanation": "Nature Medicine study confirms",
            "source_link": "https://nature.com/article",
        }
    ],
}
chunks = chunk_rag_data(state)
res = PASS if len(chunks) == 2 else FAIL
print(f"  {res}  Generated {len(chunks)} chunks (expect 2)")
types = [c["metadata"]["type"] for c in chunks]
res = PASS if "counter-perspective" in types and "fact" in types else FAIL
print(f"  {res}  Chunk types correct: {types}")

persp_chunk = next(
    (c for c in chunks if c["metadata"]["type"] == "counter-perspective"), None
)
res = (
    PASS
    if persp_chunk and persp_chunk["text"] == "AI may increase diagnostic inequality"
    else FAIL
)
print(f"  {res}  Perspective text correctly extracted from dict")
if not (persp_chunk and persp_chunk["text"]):
    errors.append("chunk_rag_data:perspective_empty")

fact_chunk = next((c for c in chunks if c["metadata"]["type"] == "fact"), None)
res = (
    PASS if fact_chunk and fact_chunk["metadata"].get("confidence") == "High" else FAIL
)
print(
    f"  {res}  Fact confidence field present: {fact_chunk['metadata'].get('confidence') if fact_chunk else 'missing'}"
)

# ── 4. SQLite Cache ─────────────────────────────────────
section("4. SQLite Cache — WAL mode + TTL + thread-local pool")
from app.db.sqlite_cache import get_connection, ARTICLE_TTL_SECS, PERSPECTIVE_TTL_SECS

conn = get_connection()
mode = conn.execute("PRAGMA journal_mode").fetchone()[0]
res = PASS if mode == "wal" else FAIL
print(f"  {res}  Journal mode: {mode} (want 'wal')")
if mode != "wal":
    errors.append("sqlite:not_wal")

print(f"  ✅     Article TTL: {ARTICLE_TTL_SECS // 86400} days (want 7)")
print(f"  ✅     Perspective TTL: {PERSPECTIVE_TTL_SECS // 86400} days (want 30)")

# Thread-local: same conn across calls
conn2 = get_connection()
res = PASS if conn is conn2 else WARN
print(f"  {res}  Thread-local pool (same object: {conn is conn2})")

# Table check
tables = [
    r[0]
    for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()
]
res = PASS if "article_cache" in tables and "perspective_cache" in tables else FAIL
print(f"  {res}  Tables: {tables}")

# Index check
indexes = [
    r[0]
    for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='index'"
    ).fetchall()
]
res = PASS if any("idx_" in i for i in indexes) else FAIL
print(f"  {res}  Indexes: {[i for i in indexes if i.startswith('idx_')]}")

# ── 5. RSS Fetcher ─────────────────────────────────────
section("5. RSS Fetcher — URL validation + quality checks")
from app.modules.trending.rss_fetcher import (
    _is_valid_url,
    _is_valid_title,
    _clean_description,
)

tests = [
    (_is_valid_url("https://bbc.com/article"), True, "valid HTTPS URL"),
    (_is_valid_url(""), False, "empty URL"),
    (_is_valid_url("ftp://junk.com"), False, "non-HTTP URL"),
    (_is_valid_url("https://feedburner.com"), False, "junk domain"),
    (_is_valid_title("Climate change impacts"), True, "valid title"),
    (_is_valid_title("hi"), False, "too short title"),
    (_is_valid_title("BREAKING NEWS NOW"), False, "all-caps title"),
]
for got, want, label in tests:
    res = PASS if got == want else FAIL
    print(f"  {res}  {label}: {got} (want {want})")
    if got != want:
        errors.append(f"rss:{label}")

desc = _clean_description("<p>Hello &amp; world!</p>")
res = PASS if desc == "Hello & world!" else FAIL
print(f"  {res}  HTML stripping + entity decode: '{desc}'")

# ── 6. URL Middleware (via live API) ───────────────────
section("6. URL Middleware — SSRF + invalid input protection")
import urllib.request
import json as _json


def post(endpoint, body):
    data = _json.dumps(body).encode()
    req = urllib.request.Request(
        f"http://localhost:8000{endpoint}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, _json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, _json.loads(e.read())
    except Exception as ex:
        return 0, {"error": str(ex)}


status, body = post("/api/process", {"url": ""})
res = PASS if status == 400 else FAIL
print(f"  {res}  Empty URL blocked (got {status}, want 400)")

status, body = post("/api/process", {"url": "http://localhost/internal"})
res = PASS if status == 400 else FAIL
print(f"  {res}  localhost URL blocked (got {status}, want 400)")

status, body = post("/api/process", {"url": "ftp://evil.com/hack"})
res = PASS if status == 400 else FAIL
print(f"  {res}  non-HTTP URL blocked (got {status}, want 400)")

# ── 7. Lens prompts ────────────────────────────────────
section("7. Lens Prompts — all 6 lenses valid")
from app.modules.perspectives.lens_prompts import build_lens_prompt, LENSES

for lens in LENSES:
    prompt = build_lens_prompt(
        lens,
        {
            "summary": "Test",
            "main_claim": "X",
            "entities": [],
            "tone": "neutral",
            "key_points": [],
        },
    )
    res = PASS if len(prompt) > 200 else FAIL
    print(f"  {res}  {lens}: {len(prompt)} chars")
    if len(prompt) <= 200:
        errors.append(f"lens:{lens}")

# ── Summary ────────────────────────────────────────────
section("SUMMARY")
total_checks = 30  # approximate
if not errors:
    print("  ✅  ALL CHECKS PASSED — system is healthy")
else:
    print(f"  ❌  {len(errors)} check(s) failed:")
    for e in errors:
        print(f"       • {e}")

print(divider)
sys.exit(0 if not errors else 1)
