# AOSSIE Best Practices Checklist

> Criteria adapted from the [OpenSSF Best Practices Badge](https://github.com/coreinfrastructure/best-practices-badge)
> (MIT / CC BY 3.0) by OpenSSF contributors. Modified for AOSSIE multi-repo template use.
>
> **Project:** Perspective AI (frontend + backend) · **[Discord Channel](https://discord.com/channels/1022871757289422898/1339226574276268144)**
>
> **Purpose:** Covers OpenSSF Best Practices criteria that are NOT auto-detected by OpenSSF Scorecard.
> Scorecard already handles: License, SAST tools, CI tests, Security Policy file, Branch Protection,
> Pinned Dependencies, Signed Releases, Maintained status, and Known Vulnerabilities.
>
> **Legend:** `[x]` met · `[-]` not applicable · `[ ]` not met · 🔴 MUST · 🟡 SHOULD · 🔵 SUGGESTED

---

## Score Summary

| Category           | Met | N/A | Total (Applicable) | Status |
|--------------------|-----|-----|--------------------|--------|
| Basics             | 7   | 0   | 8                  | 🟡     |
| Change Control     | 1   | 5   | 1 (6)              | 🟢     |
| Reporting          | 7   | 1   | 7 (8)              | 🟢     |
| Quality            | 9   | 0   | 11                 | 🟡     |
| Security           | 3   | 6   | 3 (9)              | 🟢     |
| Analysis           | 4   | 2   | 5 (7)              | 🟡     |
| **Total**          | **31** | **14** | **35 (49)**    | **88.6%** |

*N/A items are excluded from the denominator.*

---

## 🏗️ Basics

### Project Website & Documentation

- [x] 🔴 **description_good** — The project README/website clearly describes what the software does and what problem it solves.
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective#readme

- [x] 🔴 **interact** — The project provides information on how to obtain the software, submit bug reports, and contribute.
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/blob/main/CONTRIBUTING.md

- [x] 🔴 **contribution** — `CONTRIBUTING.md` explains the contribution process (e.g., PRs are used, how to open one).
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/blob/main/CONTRIBUTING.md

- [x] 🟡 **contribution_requirements** — `CONTRIBUTING.md` references acceptable contribution standards (coding style, tests required, etc.).
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/blob/main/CONTRIBUTING.md#️-code-style--architecture

- [x] 🔴 **documentation_basics** — Basic documentation exists for the software (README, Wiki, or docs folder).
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective#readme

- [ ] 🔴 **documentation_interface** — Reference documentation describes the external interface (API inputs/outputs, CLI flags, config schema, etc.).
  - *Not met yet:* the frontend configuration (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`) is documented in the [README](https://github.com/AOSSIE-Org/Perspective#readme) and `frontend/.env.example`, but the request and response shapes of the backend endpoints (`/api/process`, `/api/bias`, `/api/chat`) are not documented yet.

### Other Basics

- [x] 🔴 **discussion** — Project has a searchable, URL-addressable discussion mechanism (GitHub Issues, Discord with archive, mailing list, etc.) that doesn't require proprietary client software.
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/issues and https://discord.com/channels/1022871757289422898/1339226574276268144

- [x] 🟡 **english** — Documentation is provided in English and English bug reports/comments are accepted.
  - *Note:* All documentation is in English; the site itself is localized with next-intl.

---

## 🔄 Change Control

### Version Control

- [x] 🔵 **repo_distributed** — Project uses a distributed VCS (e.g., git). *(SUGGESTED)*
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective

### Version Numbering

- [-] 🔴 **version_unique** — Each release has a unique version identifier (e.g., v1.0.0).
  - *Note:* `[~]` N/A: continuously deployed website from `main`; there are no versioned releases to number or tag. Change history is the merged PR list.

- [-] 🔵 **version_semver** — Project uses [SemVer](https://semver.org) or [CalVer](https://calver.org/) format. *(SUGGESTED)*
  - *Note:* `[~]` N/A: continuously deployed website from `main`; there are no versioned releases to number or tag. Change history is the merged PR list.

- [-] 🔵 **version_tags** — Releases are tagged in the VCS (e.g., `git tag v1.0.0`). *(SUGGESTED)*
  - *Note:* `[~]` N/A: continuously deployed website from `main`; there are no versioned releases to number or tag. Change history is the merged PR list.

### Release Notes

- [-] 🔴 **release_notes** — Each release includes human-readable release notes summarizing major changes.
  - *Note:* `[~]` N/A: continuously deployed website from `main`; there are no versioned releases to number or tag. Change history is the merged PR list.

- [-] 🔴 **release_notes_vulns** — Release notes identify every publicly known vulnerability (with CVE) fixed in that release.
  - *Note:* `[~]` N/A: continuously deployed from `main`; there are no versioned releases or release notes. Security fixes (e.g. dependency CVEs) are described in the PR that ships them.

---

## 🐛 Reporting

### Bug Reporting

- [x] 🔴 **report_process** — A bug-reporting process exists (e.g., GitHub Issues link in README).
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/issues/new/choose

- [x] 🟡 **report_tracker** — An issue tracker (e.g., GitHub Issues) is used to track individual bugs.
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/issues

- [x] 🔴 **report_responses** — A majority of bug reports submitted in the last 2–12 months have been acknowledged.
  - *Self-certification note:* Maintainers triage issues on GitHub and in the project Discord channel.

- [x] 🟡 **enhancement_responses** — More than 50% of enhancement requests in the last 2–12 months have received a response.
  - *Self-certification note:* Feature requests are discussed and answered in the project Discord channel and on GitHub.

- [x] 🔴 **report_archive** — Reports and responses are publicly archived and searchable.
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/issues?q=is%3Aissue

### Vulnerability Reporting

- [x] 🔴 **vulnerability_report_process** — A vulnerability reporting process is documented.
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/blob/main/SECURITY.md

- [x] 🟡 **vulnerability_report_private** — If private vulnerability reporting is supported, the method for private submission is documented.
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/blob/main/SECURITY.md#reporting-a-vulnerability (GitHub private advisories or email)

- [-] 🔴 **vulnerability_report_response** — Initial response to any vulnerability report received in the last 6 months was within 14 days.
  - *Note:* `[~]` N/A: no vulnerability reports received in the last 6 months. SECURITY.md commits to acknowledging within 7 days.

---

## ✅ Quality

### Build System

- [x] 🔴 **build** — If the project requires building, a working build system exists that can auto-rebuild from source.
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/blob/main/.github/workflows/frontend-ci.yml

- [x] 🔵 **build_common_tools** — Common build tools are used (npm, Next.js). *(SUGGESTED)*
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/blob/main/frontend/package.json and https://github.com/AOSSIE-Org/Perspective/blob/main/backend/pyproject.toml

- [x] 🟡 **build_floss_tools** — The project can be built using only FLOSS tools.
  - *Note:* Node.js, npm, Next.js, Tailwind CSS, Python, uv, FastAPI: all FLOSS.

### Automated Testing

- [x] 🔵 **test_invocation** — The test suite can be invoked in a standard way. *(SUGGESTED)*
  - *Evidence URL:* `npm test` / `npm run test:coverage` in `frontend/` (https://github.com/AOSSIE-Org/Perspective/blob/main/frontend/package.json)

- [ ] 🔵 **test_most** — The test suite covers most code branches and functionality. *(SUGGESTED)*
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/blob/main/frontend/vitest.config.mts (90% line/branch/function thresholds, enforced in CI, on the frontend config, metadata, sitemap and `lib/`)
  - *Not met yet:* the frontend pages and components and the whole backend have no automated tests.

### New Functionality Testing Policy

- [ ] 🔴 **test_policy** — The project has a general policy that new functionality must include tests in the automated test suite.
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/blob/main/CONTRIBUTING.md#-pull-request-guidelines
  - *Not met yet:* CONTRIBUTING.md requires tests only for changes to `frontend/config/`, `frontend/i18n/metadata.ts`, `frontend/app/sitemap.ts` and `frontend/lib/`, not for all new functionality.

- [x] 🔴 **tests_are_added** — Evidence exists that the test policy has been followed in recent major changes.
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/tree/main/frontend/tests

- [x] 🔵 **tests_documented_added** — The test policy is documented in contribution instructions. *(SUGGESTED)*
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/blob/main/CONTRIBUTING.md#-pull-request-guidelines (for the frontend logic modules listed there)

### Linting / Warning Flags

- [x] 🔴 **warnings** — At least one linter or compiler warning flag is enabled.
  - *Tool used:* ESLint (`next/core-web-vitals` + `next/typescript`) and `tsc --noEmit` in CI for the frontend; Ruff via CodeRabbit for the backend.

- [x] 🔴 **warnings_fixed** — Warnings from the linter are addressed.
  - *Note:* Frontend lint, type-check, tests and build run in CI, without warnings, on every PR and push to `main` that changes `frontend/`. The build no longer sets `ignoreBuildErrors` / `ignoreDuringBuilds`.

- [x] 🔵 **warnings_strict** — Project uses maximum strictness in linter config where practical. *(SUGGESTED)*
  - *Note:* Next.js recommended + core-web-vitals rule sets; type errors fail the build.

---

## 🔐 Security

### Secure Development Knowledge

- [x] 🔴 **know_secure_design** — Primary developer knows how to design secure software.
  - *Self-certification note:* Frontend is a static export with no cookies, and the backend keeps API keys in environment secrets. The backend logs submitted article URLs, and when vector storage succeeds it sends embeddings of the analysis with their metadata to Pinecone.

- [x] 🔴 **know_common_errors** — Primary developer knows common vulnerability types (XSS, CSRF, SSRF) and mitigations.
  - *Self-certification note:* Article text and LLM output are rendered as escaped React text (no `dangerouslySetInnerHTML`); SSRF and prompt-injection risks of the URL input are tracked in the CodeRabbit backend rules; dependencies are pinned via `package-lock.json` and `uv.lock`.

### Cryptography

- [-] 🔴 **crypto_published** — Only publicly reviewed cryptographic protocols/algorithms are used by default.
  - *Note:* `[~]` N/A: no cryptography is implemented and there are no user accounts. Provider API keys are read from environment variables / Hugging Face secrets, and all traffic uses HTTPS.

- [-] 🟡 **crypto_call** — Project calls an established crypto library rather than reimplementing crypto functions.
  - *Note:* `[~]` N/A: no cryptography is implemented and there are no user accounts. Provider API keys are read from environment variables / Hugging Face secrets, and all traffic uses HTTPS.

- [-] 🔴 **crypto_working** — No broken algorithms used.
  - *Note:* `[~]` N/A: no cryptography is implemented and there are no user accounts. Provider API keys are read from environment variables / Hugging Face secrets, and all traffic uses HTTPS.

- [-] 🔴 **crypto_keylength** — Key lengths meet NIST 2030 minimums by default.
  - *Note:* `[~]` N/A: no cryptography is implemented and there are no user accounts. Provider API keys are read from environment variables / Hugging Face secrets, and all traffic uses HTTPS.

- [-] 🔴 **crypto_password_storage** — Passwords for external users are stored as iterated salted hashes.
  - *Note:* `[~]` N/A: no cryptography is implemented and there are no user accounts. Provider API keys are read from environment variables / Hugging Face secrets, and all traffic uses HTTPS.

- [-] 🔴 **crypto_random** — Cryptographic keys and nonces are generated using a CSPRNG.
  - *Note:* `[~]` N/A: no cryptography is implemented and there are no user accounts. Provider API keys are read from environment variables / Hugging Face secrets, and all traffic uses HTTPS.

- [x] 🟡 **delivery_unsigned** — Cryptographic hashes are NOT retrieved over plain HTTP without a signature check.
  - *Note:* Site served only over HTTPS; npm packages are verified against `package-lock.json` integrity hashes.

---

## 🔬 Analysis

### Static Code Analysis

- [x] 🔴 **static_analysis_fixed** — All medium+ severity vulnerabilities found by static analysis are fixed in a timely manner.
  - *Note:* CodeRabbit reviews every PR (security findings are resolved before merge); OpenSSF Scorecard runs weekly.

- [x] 🔵 **static_analysis_common_vulnerabilities** — The static analysis tool includes checks for common vulnerabilities. *(SUGGESTED)*
  - *Tool + ruleset:* CodeRabbit security review (https://github.com/AOSSIE-Org/Perspective/blob/main/.coderabbit.yaml) and OpenSSF Scorecard (https://github.com/AOSSIE-Org/Perspective/blob/main/.github/workflows/scorecard.yml).

- [x] 🔵 **static_analysis_often** — Static analysis runs on every commit or at least daily. *(SUGGESTED)*
  - *Evidence URL:* https://github.com/AOSSIE-Org/Perspective/blob/main/.github/workflows/frontend-ci.yml (ESLint on PRs and pushes to `main` that change `frontend/`); CodeRabbit reviews every PR

### Dynamic Code Analysis

- [ ] 🔵 **dynamic_analysis** — Dynamic analysis applied before major releases. *(SUGGESTED)*
  - *Not met yet:* no fuzzer or input-varying scanner runs before deploys, and branch coverage above 80% is only measured on the scoped frontend modules (see `test_most`). Lighthouse audits are run on the deployed site, but they do not vary inputs.

- [x] 🔵 **dynamic_analysis_enable_assertions** — Dynamic analysis runs with assertions enabled. *(SUGGESTED)*
  - *Note:* Vitest executes hooks and modules in jsdom with React's development build, so runtime invariant checks are active.

- [-] 🔴 **dynamic_analysis_fixed** — Medium+ severity vulnerabilities fixed in a timely manner.
  - *Note:* `[~]` N/A: dynamic analysis has not found medium or higher severity vulnerabilities.

- [-] 🔵 **dynamic_analysis_unsafe** — Memory safety tools used. *(SUGGESTED)*
  - *Note:* `[~]` N/A: memory-safe TypeScript/JavaScript; no native code.
