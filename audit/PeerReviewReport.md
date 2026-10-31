# Perspective — Saksham Jain Contribution Review

**Repository:** [AOSSIE-Org/Perspective](https://github.com/AOSSIE-Org/Perspective)  
**Contributor reviewed:** [Saksham Jain (`reach2saksham`)](https://github.com/reach2saksham)  
**Reviewed changes:** [PR #158 — Next.js overhaul and backend modernization](https://github.com/AOSSIE-Org/Perspective/pull/158) (merge `70a2af4d9e98e659d1bc0bdf0d8551f91dee0638`), [PR #169 — hide impact page](https://github.com/AOSSIE-Org/Perspective/pull/169) (merge `f797b8a4f614354afd4328cb1a97253a20df8f50`), and [PR #180 — deployable frontend, SEO, tests and security update](https://github.com/AOSSIE-Org/Perspective/pull/180) (merge `6f3667905aa7b3e03540b2522e4c5ca1b003413d`).
**Review area:** Saksham’s changed files in these merged PRs, including frontend navigation and analysis flow, selected backend processing modules, and frontend deployment/metadata configuration.

## Overall assessment

The contribution is broader than a landing page: PR #158 also modifies backend fact checking, LLM processing, and workflow modules. One low-severity URL-prefill issue was identified in the new frontend flow. The server-side URL-fetching concern noted in the earlier repository-wide review is in existing API/extractor code that these reviewed PRs did not change, so it is outside this contribution-scoped report.

## Finding 1 — URL query prefill decodes an already-decoded value a second time

**Severity:** Low — functional issue  
**Location:** `frontend/app/[locale]/page.tsx:86–91` (introduced in PR #158).

**Observation:** The page reads the `url` query parameter using `URLSearchParams.get()` and then calls `decodeURIComponent(queryUrl)`. `URLSearchParams` has already decoded the query parameter once. The extra decoding can change valid percent-encoded URL path components; for example, an encoded `%2F` in the target URL becomes `/` before the user submits it.

**Impact:** Users arriving through a URL-prefill link may see and submit a different article URL than the sender supplied when the target URL contains encoded reserved characters. This affects the optional `?url=` prefill path; manual URL entry is not affected.

**Suggested resolution:** Use the value returned by `URLSearchParams.get()` directly. If links are built elsewhere, encode the complete target URL once when constructing the outer query parameter.

## Review checklist

| Area | Result |
|---|---|
| Saksham’s PR attribution and changed-file scope | Reviewed merged PRs #158, #169, and #180 and the Saksham-authored changes in their diffs. |
| Frontend URL submission | The form checks URL syntax and restricts schemes to HTTP(S); query-prefill double decoding is reported above. |
| Backend modules modified by Saksham | Reviewed the fact-checking, LLM, logging, and workflow files changed in PR #158; no additional substantiated finding is reported. |
| Frontend metadata/deployment changes | Reviewed the locale metadata, API configuration, static-export and workflow changes in PR #180; no additional substantiated finding is reported. |
| Responsive presentation | I installed the project dependencies and checked the frontend in a browser across screen sizes; it displayed and behaved responsively. |

## Validation

This review is limited to Saksham’s changed files in the merged PRs listed above. The frontend was checked in a browser across screen sizes. The reported query-prefill issue is based on the `URLSearchParams` decoding behavior and the subsequent `decodeURIComponent` call; I did not execute a dedicated reproduction. Unchanged repository code was not included in the contribution-scoped findings.

## Conclusion

One low-severity functional issue is reported in the frontend URL-prefill path. The review covers Saksham’s frontend and backend changes in the listed PRs, not the entire Perspective repository.
