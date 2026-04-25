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
6. If the company fails in the resolve path and you can assemble a trustworthy Torre-ready organization payload, switch only the company to `company.direct_publish`.
7. If the company succeeds but the job fails in the resolve path and you can assemble a Torre-ready opportunity payload, keep the company on `company.resolve_and_publish` with `torre_id` and switch only the job to `job.direct_publish`.
8. Every fallback request with a different strategy or body shape must use a new `request_id`.
9. Report first-pass `resolve_and_publish` effectiveness separately from final effectiveness after direct fallback.
10. For recoverable job failures, browser/source remediation is required before final failure classification.

## Fallback Policy After Resolve Failure

Use fallback when the first request reached a terminal failure but the source evidence is still good enough to publish manually through the API.

Before building `job.direct_publish`, open the canonical job URL in a browser or equivalent source reader and capture current role evidence. Use stale listing snippets only as supporting metadata, not as the primary direct-publish source.

| Failure point | Fallback request |
| --- | --- |
| Company resolve failed, job was never attempted | `company.direct_publish`, optionally plus original `job.resolve_and_publish` |
| Company resolve failed and job payload can also be assembled | `company.direct_publish + job.direct_publish` |
| Company succeeded with `torre_id`, job resolve failed | `company.resolve_and_publish` with `company.input.torre_id` + `job.direct_publish` |
| Company-only resolve failed | company-only `company.direct_publish` |

Do not fallback when:

- company identity is ambiguous
- the job page is closed or unavailable
- the only URL is an aggregator or listing index
- direct publish was already attempted and Torre rejected the payload
- the request is missing `sharer_gg_id` for job publication
- the run policy excludes the role, such as remote-only runs encountering hybrid or physical jobs

Recoverable errors that should trigger browser/source remediation:

- timeout while resolving or crawling the job page
- missing opportunity id
- extraction returned empty or unusable job content
- place/location validation failed
- the URL is a redirect, company search URL, or weak ATS wrapper but the role appears reachable

## Company-Only Paths

### `company.resolve_and_publish`

- Use when the user only wants the company published or the job is not ready to be sent.
- Behavior: asynchronous.

### `company.direct_publish`

- Use when the user only wants the company published and the organization payload is already Torre-ready.
- Behavior: synchronous.
- After a company resolve failure, build this payload with `company-direct-publish-prompt.md` and preserve the failed request evidence.

## Mixed Paths

### 1. `company.direct_publish + job.direct_publish`

- Use when both sides are already Torre-ready.
- Behavior: synchronous.
- Errors: provider errors return inline.
- Useful after both sides fail resolve but source evidence is still strong.

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

### `job.direct_publish`

Use only when the job block is already a Torre-ready opportunity payload.
