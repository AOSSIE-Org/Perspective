# Security Policy

## Supported Versions

This repository contains the Perspective frontend (static site, deployed from `main`) and the FastAPI backend (deployed to Hugging Face Spaces from `main`). Only the currently deployed versions are supported.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions or pull requests.**

Report them privately in one of these ways:

1. **GitHub private vulnerability reporting (preferred):** open the [Security tab](https://github.com/AOSSIE-Org/Perspective/security/advisories/new) and click **Report a vulnerability**.
2. **Email:** [reach2saksham2004@gmail.com](mailto:reach2saksham2004@gmail.com), with `[SECURITY] Perspective` in the subject.

Please include:

- the affected URL, file or component, and whether it is the frontend, the backend API, or an upstream provider (Groq, Pinecone)
- steps to reproduce, or a proof of concept
- the impact you expect (e.g. XSS, SSRF via the article-URL input, prompt injection, key exposure, supply-chain risk)

## What to Expect

- **Acknowledgement** within 7 days.
- **Initial assessment** within 14 days.
- A fix, or a mitigation plan, for confirmed issues as soon as practical. We will credit you in the release notes unless you ask us not to.

## Scope

In scope: the frontend and backend source in this repository, its build and deployment workflows, and its dependencies. Leaked API keys (Groq, Pinecone) count as vulnerabilities: report them privately so they can be rotated.
Out of scope: third-party services linked from the site (GitHub, Discord, social networks).
