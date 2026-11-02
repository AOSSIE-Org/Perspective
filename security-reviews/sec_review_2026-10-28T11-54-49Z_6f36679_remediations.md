# Remediations of Security Review Findings

Review date and time: 2026-10-28T11:54:49Z (UTC)

## Remediations

### Remediation of Finding 1: Unrestricted server-side request forgery (full-read) via the article URL

- [ ] This remediation implements the security review's recommendation for this finding.
- [x] This remediation addresses the finding in a way that differs from the security review's recommendation.

Remediation commits:
- [f0b65b4](https://github.com/reach2saksham/Perspective/commit/f0b65b439be63997a2b6a5696ec6f94f4d053665)

Description: New safe_fetch.py allows only http(s) URLs whose host resolves to public addresses, follows redirects manually and re-checks each hop, and caps responses at 5 MiB (5 × 1024 × 1024 bytes); /api/process and /api/bias reject other URLs with 400; the extractor fetches once and passes the HTML to trafilatura, newspaper and readability. /api/process still returns cleaned_text.

## Non-remediated findings

None.
