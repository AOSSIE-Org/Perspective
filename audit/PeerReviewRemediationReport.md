# Perspective: Peer Review Remediation Report

| | |
|---|---|
| **Peer review** | [`audit/PeerReviewReport.md`](PeerReviewReport.md) (merged in [PR #184](https://github.com/AOSSIE-Org/Perspective/pull/184)) |
| **Reviewer** | Piyush ([@Piyushbijarania](https://github.com/Piyushbijarania)) |
| **Reviewed revision** | PRs #158, #169 and #180 (merge commits `70a2af4`, `f797b8a`, `6f36679`) |
| **Remediated by** | Saksham Jain ([@reach2saksham](https://github.com/reach2saksham)) |
| **Date** | 1 November 2026 |

## Summary

| Finding | Severity | Status |
|---|---|---|
| Finding 1: URL query prefill decodes an already-decoded value a second time | Low | ✅ Fixed in this PR |

## Finding 1: URL query prefill decodes an already-decoded value a second time

**Severity:** Low · **Status:** Fixed

**Cause.** `frontend/app/[locale]/page.tsx` called `decodeURIComponent()` on the value from `URLSearchParams.get("url")`, which is already decoded. Besides changing encoded characters (`%2F` → `/`, `%25` → `%`), a URL with a lone `%` (e.g. `…/a%zz`) made `decodeURIComponent` throw a `URIError`, breaking the page's mount effect.

**Fix.**

- Added `frontend/lib/prefill-url.ts` with `getPrefillUrl(search)`, which returns the `url` parameter as decoded once by `URLSearchParams`.
- The landing page uses it and sets the input to that value directly. There are no other `decodeURIComponent` calls in the frontend.

**Regression tests.** New `frontend/tests/prefill-url.test.ts`: an encoded article URL round-trips exactly (`%2F` and `%25` kept), a lone `%` doesn't throw, and empty or missing parameters return `null`.

## Related item

The report also mentions the server-side URL-fetching concern from the earlier repository-wide review, as out of its scope. It is fixed in this same branch, in the AI security-review remediation: the backend now fetches articles through `backend/app/modules/scraper/safe_fetch.py`, which allows only http(s) URLs that resolve to public addresses (private, loopback, link-local and other reserved ranges are rejected) and re-checks every redirect hop. See the AI security-review report in this repository.

## Verification

Frontend: `npm run lint` ✅ · `npx tsc --noEmit` ✅ · `npx vitest run` ✅ 76/76 · `npm run build` ✅
