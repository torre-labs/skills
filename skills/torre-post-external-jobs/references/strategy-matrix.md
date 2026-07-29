# Strategy Matrix

Use this matrix when choosing strategies for Torre Post External Jobs.

## Core Rule

- If either entity uses `resolve_and_publish`, the request is asynchronous.
- `company.direct_publish` is synchronous when `job` is omitted.
- `company.direct_publish + job.direct_publish` is synchronous.

## Recommended Policy

1. If the source contains multiple candidate jobs, select the publish set before building any request payload.
2. Resolve company identity and canonical job context before choosing the strategy mix.
3. If the user only wants organization publication, use a company-only request.
4. If you do not know whether the company is already published, start with `company.resolve_and_publish + job.resolve_and_publish`.
5. If you know the company is already published and you have its `torre_id`, use `company.resolve_and_publish` with `company.input.torre_id` and keep the job on `resolve_and_publish` by default.
6. If the company fails in the resolve path and a Torre-ready organization
   payload is already available, switch only the company to
   `company.direct_publish`.
7. Use `job.direct_publish` only when a Discovery-ready
   `SaveFullOpportunityDTO` payload existed before this workflow began. Do not
   construct one from browser evidence after a resolver failure.
8. Do not choose `job.direct_publish` only to control `crawled`;
   `job.resolve_and_publish` supports optional `job.input.crawled`.
9. For the same canonical job, make at most two `resolve_and_publish` attempts:
   the normal request and one browser-remediated request with
   `source_preference: "provided"`.
10. Use a new `request_id` for the remediated request.
11. If the provided-evidence request still fails, record `manual_review`; do
    not create a second job payload contract in the agent.
12. Report first-pass effectiveness separately from final effectiveness after
    source remediation.

## Source Remediation After Resolve Failure

Use source remediation when the first request reached a source-related terminal
failure but the canonical detail page remains trustworthy and readable.
If that request already used complete evidence with
`source_preference: "provided"`, record `manual_review` instead of resubmitting
the same evidence.

Open the canonical job URL in a browser or equivalent source reader and capture
complete current role evidence. Then submit a new `job.resolve_and_publish`
request with the same canonical `job_url`, `source_preference: "provided"`,
and complete `raw_html` or `raw_text`.

| Failure point | Remediation request |
| --- | --- |
| Job source fetch or extraction failed | Original company strategy + remediated `job.resolve_and_publish` |
| Company succeeded with `torre_id`, job resolve failed | `company.resolve_and_publish` with `company.input.torre_id` + remediated `job.resolve_and_publish` |
| Company resolve failed, job was never attempted | Apply the documented company-only workaround; keep the job on `job.resolve_and_publish` |
| Company-only resolve failed | Company-only remediation; no job contract is involved |

For the specific `request_processing_failed` company-enrichment timeout, first
reuse a known `torre_id`. If none is available, the narrower
`company.direct_publish` then `company.resolve_and_publish {torre_id} +
job.resolve_and_publish` workaround may be used. A name-only company payload
requires explicit operator confirmation every time because Spider performs no
local company deduplication. See
[company-enrichment-timeout-workaround.md](company-enrichment-timeout-workaround.md).

Do not remediate when:

- company identity is ambiguous
- the job page is closed or unavailable
- the only URL is an aggregator or listing index
- the request is missing `sharer_gg_id` for job publication
- the run policy excludes the role, such as remote-only runs encountering hybrid or physical jobs

Recoverable errors that should trigger browser/source remediation:

- timeout while resolving or crawling the job page
- `request_processing_failed` timeout on the company side (distinct from a job-page timeout — see [company-enrichment-timeout-workaround.md](company-enrichment-timeout-workaround.md))
- missing opportunity id
- extraction returned empty or unusable job content
- place/location validation failed (see [place-validation-workaround.md](place-validation-workaround.md))
- `completed_with_skips` with `terminal_reason: "insufficient_strengths"` when
  the first request did not contain complete source evidence
- the URL is a redirect, company search URL, or weak ATS wrapper but the role appears reachable
- `redirect_not_acceptable` when Spider rejects a malformed, non-HTTP, looping,
  or over-limit HTTP redirect chain and a verified final role URL is available
  independently

During remediation, follow only clean HTTP redirects. Spider requires every 3xx
hop to have a usable HTTP(S) `Location`, no loop, and no hop-limit overflow. A
`200` wrapper that still needs a click, login, search, or form is not a Spider
redirect failure; use a verified final role URL with complete provided evidence,
or mark the row `manual_review`.

For place/location failures, do not remove location evidence. Send the complete
source once with `source_preference: "provided"`; if validation still fails,
mark `manual_review`. The agent must not construct `opportunity.place` or
`opportunity.strengths`.

## Company-Only Paths

### `company.resolve_and_publish`

- Use when the user only wants the company published or the job is not ready to be sent.
- Behavior: asynchronous.

### `company.direct_publish`

- Use when the user only wants the company published and the organization payload is already Torre-ready.
- Behavior: synchronous.
- After a company resolve failure, use
  [company-direct-publish-prompt.md](company-direct-publish-prompt.md) only
  under the documented company workaround and preserve the failed evidence.

## Mixed Paths

### 1. `company.direct_publish + job.direct_publish`

- Use when both sides are already Torre-ready.
- Behavior: synchronous.
- Errors: provider errors return inline.
- This is not a resolver fallback.

### 2. `company.direct_publish + job.resolve_and_publish`

- Use when the company is already Torre-ready but the job still needs extraction from `job_url`, `raw_text`, or `raw_html`.
- Behavior: asynchronous.

### 3. `company.resolve_and_publish + job.direct_publish`

- Use when the company must be resolved from identifiers but the job is already Torre-ready.
- Behavior: asynchronous.
- Prefer `company.input.torre_id` when the previous resolve attempt already created or found the Torre organization.

### 4. `company.resolve_and_publish + job.resolve_and_publish`

- Use when both sides still need the API to resolve, enrich, extract, or assemble.
- Behavior: asynchronous.

## Entity Rules

### `company.resolve_and_publish`

Use when the company is described by identifiers such as:

- `name`
- `domain`
- `website_url`
- `linkedin`
- `careers_url`
- `torre_id`

### `company.direct_publish`

Use only when the company block is already a Torre-ready organization payload.

### `job.resolve_and_publish`

Use when the job must be derived from:

- `job_url`
- `raw_text`
- `raw_html`
- `source_preference: "provided"` when complete trusted evidence should replace
  source snapshot fetching
- optional `crawled` metadata, when the operator or source explicitly provides a boolean

### `job.direct_publish`

Use only when the job block is already a Discovery-ready opportunity payload,
including complete place, organizations, strengths, arrays, details,
compensation, and any required commitment.
