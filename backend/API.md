# Perspective API reference

The backend is a FastAPI app ([`main.py`](main.py)) whose routes live in [`app/routes/routes.py`](app/routes/routes.py). This page documents every endpoint, its request and response bodies, its errors, the limits that apply, and the environment variables the server needs.

- **Base path:** all routes are mounted under `/api`.
- **Local base URL:** `http://localhost:<PORT>`. `backend/.env.example` sets `PORT=8000`; without `PORT` the server listens on `7860` (`DEFAULT_PORT` in [`app/config.py`](app/config.py)), the port Hugging Face Spaces expects.
- **Hosted base URL:** `https://thunder1245-perspective-backend.hf.space` (the frontend default in [`frontend/config/api.ts`](../frontend/config/api.ts)).
- **Format:** request and response bodies are JSON (`Content-Type: application/json`).
- **Authentication:** none.
- **CORS:** every origin, method and header is allowed (`CORS_ALLOW_ORIGINS = ["*"]`).
- **Interactive docs:** FastAPI also serves `/docs` (Swagger UI), `/redoc` and `/openapi.json`. They show the request schemas, but the routes declare no response models, so use this page for response shapes.

| Method | Path           | Purpose                                                          |
|--------|----------------|------------------------------------------------------------------|
| GET    | `/api/`        | Health check                                                     |
| POST   | `/api/bias`    | Bias score (0 to 100) for an article URL                          |
| POST   | `/api/process` | Full analysis: sentiment, fact checks and a counter-perspective  |
| POST   | `/api/chat`    | Question answering over stored analyses (RAG)                    |

---

## `GET /api/`

Health check. Takes no input.

**200 OK**

```json
{ "message": "Perspective API is live!" }
```

---

## `POST /api/bias`

Fetches the article, extracts and cleans its text, and asks the bias model (`BIAS_MODEL`) for a score.

### Request body (`URlRequest`)

| Field | Type   | Required | Description                         |
|-------|--------|----------|-------------------------------------|
| `url` | string | yes      | Public `http` or `https` article URL |

```json
{ "url": "https://www.example.com/news/city-budget" }
```

### Response: 200 OK, success

| Field        | Type    | Description                                              |
|--------------|---------|----------------------------------------------------------|
| `bias_score` | integer | 0 (neutral) to 100 (highly biased), clamped to that range |
| `status`     | string  | `"success"`                                              |

```json
{ "bias_score": 62, "status": "success" }
```

### Response: 200 OK, analysis failed

Failures after the URL check are returned with status 200 and this body:

| Field        | Type   | Description                     |
|--------------|--------|---------------------------------|
| `status`     | string | `"error"`                       |
| `error_from` | string | `"bias_detection"`              |
| `message`    | string | Reason for the failure          |

```json
{
  "status": "error",
  "error_from": "bias_detection",
  "message": "No readable text could be extracted from this article."
}
```

That message is returned whenever the page yields no text, which includes every fetch failure: a non-2xx status, a redirect to a private address, too many redirects, a body over the size cap, or a timeout. The other messages come from an unparseable model reply (`No parseable score in model response: ...`) or a Groq API error.

Errors: [400](#400-bad-request-unsafe-url) for an unsafe URL, [422](#422-unprocessable-entity-invalid-body) for an invalid body.

---

## `POST /api/process`

Fetches and cleans the article, then runs the LangGraph workflow ([`app/modules/langgraph_builder.py`](app/modules/langgraph_builder.py)):

1. **Sentiment** of the article (`SENTIMENT_MODEL`).
2. **Fact checking:** extract claims (`CLAIM_EXTRACTOR_MODEL`), search the web for each (Google Custom Search when `SEARCH_KEY` is set, otherwise DuckDuckGo), and verify each claim against the top result (`FACT_VERIFIER_MODEL`). At most `MAX_CLAIMS` (3) claims are checked. If no claims can be parsed, the first sentences of the article are used.
3. **Counter-perspective** generation (`PERSPECTIVE_MODEL`).
4. **Judging** the perspective with a 0 to 100 score (`JUDGE_MODEL`). A score below `PERSPECTIVE_MIN_SCORE` (70) regenerates the perspective, up to `PERSPECTIVE_MAX_RETRIES` (3) attempts in total; the last attempt is returned even if it scores below 70.
5. **Storage:** the perspective and each fact are embedded (`EMBEDDING_MODEL`) and upserted into the Pinecone index `perspective`, namespace `default`. `/api/chat` searches this data. A storage failure is logged and does not change the response.

### Request body (`URlRequest`)

Same as [`/api/bias`](#post-apibias): `{ "url": "<public http(s) URL>" }`.

### Response: 200 OK, success

The body is the final workflow state:

| Field          | Type             | Description |
|----------------|------------------|-------------|
| `cleaned_text` | string           | Article text after boilerplate removal |
| `sentiment`    | string           | Lower-cased model label; the model is asked for `positive`, `negative` or `neutral` |
| `facts`        | array of objects | One entry per verified claim (see below); may be empty |
| `perspective`  | object           | `{ "reasoning": string, "perspective": string }` |
| `score`        | integer          | Judge score of the returned perspective, 0 to 100 |
| `retries`      | integer          | Number of perspective generations, 1 to 3 |
| `status`       | string           | `"success"` |

Each `facts` entry is the verifier model's JSON reply. The model is asked for these keys, but they are not validated:

| Field            | Type   | Description |
|------------------|--------|-------------|
| `verdict`        | string | `"True"` or `"False"`; `"Unverified"` when the reply could not be parsed |
| `explanation`    | string | Short justification |
| `original_claim` | string | The claim that was checked |
| `source_link`    | string | URL of the search result used as evidence |

```json
{
  "cleaned_text": "The city council approved a 40 million dollar transport budget on Monday...",
  "sentiment": "positive",
  "facts": [
    {
      "verdict": "True",
      "explanation": "The council's published minutes confirm the vote.",
      "original_claim": "The city council approved a 40 million dollar transport budget.",
      "source_link": "https://www.example.org/council/minutes"
    }
  ],
  "perspective": {
    "reasoning": "The article presents the budget as sufficient, but maintenance backlogs...",
    "perspective": "Critics argue the budget only covers new projects and leaves..."
  },
  "score": 82,
  "retries": 1,
  "status": "success"
}
```

The scraper's `keywords` are passed into the workflow but are not part of the response.

### Response: 200 OK, workflow stopped

If any step fails (for example the article has no text, no search results were found for any claim, or a Groq call failed), the workflow stops and returns status 200 with `"status": "stopped_due_to_error"`. The body keeps `cleaned_text` and any fields produced before the failure. The failing step and its message are written to the server log only, not to the response.

```json
{
  "cleaned_text": "The city council approved a 40 million dollar transport budget on Monday...",
  "sentiment": "positive",
  "status": "stopped_due_to_error"
}
```

Errors: [400](#400-bad-request-unsafe-url) for an unsafe URL, [422](#422-unprocessable-entity-invalid-body) for an invalid body.

---

## `POST /api/chat`

Embeds the message, retrieves the `RAG_TOP_K` (5) closest chunks from Pinecone, and asks `CHAT_MODEL` to answer using only that context. Retrieval is not filtered by article: it searches every analysis stored by `/api/process`.

### Request body (`ChatQuery`)

| Field     | Type   | Required | Description        |
|-----------|--------|----------|--------------------|
| `message` | string | yes      | The user's question |

```json
{ "message": "What do critics say about the transport budget?" }
```

### Response: 200 OK

| Field    | Type   | Description         |
|----------|--------|---------------------|
| `answer` | string | The model's answer  |

```json
{ "answer": "Critics say the budget funds new projects but not the maintenance backlog..." }
```

Errors: [422](#422-unprocessable-entity-invalid-body) for an invalid body; [500](#500-internal-server-error) if Pinecone or Groq fails.

---

## Errors

### 400 Bad Request: unsafe URL

`/api/bias` and `/api/process` check the submitted URL with `validate_public_url` ([`app/modules/scraper/safe_fetch.py`](app/modules/scraper/safe_fetch.py)) before scraping. The body is `{ "detail": "<message>" }`, with one of these messages:

| `detail` | Cause |
|----------|-------|
| `Only http and https URLs are allowed.` | Scheme other than `http`/`https`, or no host |
| `The URL's host could not be resolved.` | DNS lookup failed, or the port is invalid |
| `The URL points to a private or reserved address.` | Any resolved address is not globally routable (loopback, private, link-local, carrier-grade NAT, reserved, ...) |

```json
{ "detail": "The URL points to a private or reserved address." }
```

Redirects are checked the same way while the page is fetched. A redirect to a private address does not return 400: the fetch fails and the endpoint returns its normal "no text" result (see [`/api/bias`](#response-200-ok-analysis-failed) and [`/api/process`](#response-200-ok-workflow-stopped)).

### 422 Unprocessable Entity: invalid body

FastAPI's standard validation error, returned when the body is not JSON, a required field is missing, or a field is not a string. `loc` names the offending field.

```json
{
  "detail": [
    { "type": "missing", "loc": ["body", "url"], "msg": "Field required", "input": {} }
  ]
}
```

### 500 Internal Server Error

An unexpected exception (for example a Pinecone or Groq failure in `/api/chat`) returns status 500 with the plain-text body `Internal Server Error`. Details are in the server log.

---

## Limits and timeouts

All values are set in [`app/config.py`](app/config.py).

| Setting | Value | Applies to |
|---------|-------|------------|
| `FETCH_TIMEOUT_SECONDS` | 10 s | Connect and read timeout for each article request (and each redirect hop) |
| `FETCH_MAX_REDIRECTS` | 5 | Redirects followed when fetching an article |
| `FETCH_MAX_BYTES` | 5 MiB | Largest article body read; larger pages are rejected |
| `GOOGLE_SEARCH_TIMEOUT_SECONDS` | 8 s | Each Google Custom Search request |
| `MAX_CLAIMS` | 3 | Claims fact-checked per article |
| `PERSPECTIVE_MAX_RETRIES` | 3 | Perspective generations per article |
| `RAG_TOP_K` | 5 | Chunks retrieved per chat message |

The API has no rate limiting, no request-size limit beyond the server defaults, and no timeout of its own on Groq calls. A `/api/process` request makes up to 11 model calls (1 sentiment, 1 claim extraction, 3 verifications, 3 generations, 3 judgments), so it can take tens of seconds; the frontend waits up to 90 s for `/api/process` and `/api/bias` and 30 s for `/api/chat` (`API_TIMEOUT_MS` in [`frontend/config/api.ts`](../frontend/config/api.ts)).

---

## Environment variables

Copy [`.env.example`](.env.example) to `.env` in `backend/`. Model names, sampling settings and limits are not environment variables; they live in [`app/config.py`](app/config.py).

| Variable | Required | Used for |
|----------|----------|----------|
| `GROQ_API_KEY` | yes | All LLM calls. The Groq clients are created at startup, so the server does not start without it. |
| `PINECONE_API_KEY` | yes | Storing and searching analyses. Checked at startup ([`app/db/vector_store.py`](app/db/vector_store.py)), which also creates the `perspective` index (384 dimensions, cosine, AWS `us-east-1` serverless) if it does not exist. |
| `SEARCH_KEY` | no | Google Custom Search key for fact checking. When unset or left as the `.env.example` placeholder, DuckDuckGo is used instead. |
| `PORT` | no | Listening port; defaults to `7860`. The server binds to `0.0.0.0`. |
| `HF_TOKEN` | no | Not read by the backend code. The Hugging Face Hub library uses it, if set, when downloading the embedding model. Deploying to Hugging Face Spaces uses the `HF_TOKEN` GitHub Actions secret. |
