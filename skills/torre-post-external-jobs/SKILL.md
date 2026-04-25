---
name: torre-post-external-jobs
description: Use when a user wants to publish one or more external jobs to Torre from a job URL, raw job content, or a listing page, and the work may require selecting which jobs to publish, resolving company identity, or choosing between resolve_and_publish and direct_publish.
---

# Torre Post External Jobs

## Overview

Use this skill as the orchestrator for the full trusted-ingest workflow.

Do not jump straight to payload construction. First lock which jobs should be published, then resolve trustworthy company and job inputs, then choose the request shape and strategy.

This skill coordinates:

- `torre-select-external-jobs` when the source contains multiple candidate jobs
- `torre-resolve-external-job-context` before building any request body
- `torre-operate-external-job-batches` when the work is long-running or large enough to need a durable queue

## Required Variables

- `TORRE_API_KEY`: Torre API Key used in the `Authorization: Bearer ...` header. This key must be provisioned by Torre for the trusted ingest API and must remain active.

## Recommended Session Defaults

Capture these once when they are available:

- `TORRE_API_URL`: Default to `https://crawl.torre.ai/api`. Do not ask the user for this unless they explicitly need a different environment.
- `default_sharer_gg_id`: Reuse for every selected job unless the user overrides it per job.
- `default_subtorre`: Optional default subtorre slug for selected jobs.
- `status_poll_interval_ms`: Default to `2000`. Never poll faster than `1000`.

If the user has not mentioned `sharer_gg_id`, surface it early as an available option before the first publishable request is built.

## Workflow

### 0. Decide whether this is a single request or a batch run

- If the work covers only a few jobs, stay in this skill.
- If the run may include dozens, hundreds, or thousands of jobs, or it starts from a browser/listing workflow, switch into `torre-operate-external-job-batches`.
- Batch runs should choose intake mode first:
  - `browser`
  - `link`

### 1. Define the publish set before preparing payloads

- If the source contains multiple jobs, do not assume all of them should be published.
- Build a shortlist first, or ask the user for explicit filters or approval.
- If the user only wants company publication, keep the request company-only and omit `job`.
- If the source is a listing page such as Hacker News Jobs, treat it as a discovery surface, not as the final company or job URL.

Use `torre-select-external-jobs` when the publish set is not already explicit.

### 2. Resolve company identity and canonical job context

- Never use aggregator URLs such as `https://news.ycombinator.com/jobs` as:
  - `company.input.website_url`
  - `company.input.domain`
  - `job.input.job_url`
  - `publish_payload.opportunity.externalApplicationUrl`
- Never use a YC listing page as the company website just because the source page links there.
- Resolve the actual company identity from the best available signal:
  - `torre_id`
  - company website
  - company domain
  - LinkedIn company URL
  - company name
- Resolve the canonical job URL from the most specific stable job page you can verify.
- If trustworthy job content exists but no trustworthy canonical job URL exists, use `raw_text` or `raw_html` and do not invent a URL.

Use `torre-resolve-external-job-context` before choosing the request strategy.

### 3. Choose the right request shape and strategy

- Use `company.resolve_and_publish + job.resolve_and_publish` by default when both sides still need resolution.
- Use `company.resolve_and_publish` without `job` for company-only requests.
- Use `company.direct_publish` only when the organization payload is already Torre-ready.
- Use `job.direct_publish` only when the opportunity payload is already Torre-ready.
- If the company is already known in Torre and you have `torre_id`, prefer `company.resolve_and_publish` with that identifier before considering `company.direct_publish`.
- If manual content and `job_url` are both available, keep both. Manual content is the extraction source; `job_url` stays as the canonical URL.
- Treat `resolve_and_publish` failure as a routing event, not as the end of the attempt. When the source material is still trustworthy, prepare a `direct_publish` fallback payload and submit a new request with a new `request_id`.

Open [references/strategy-matrix.md](references/strategy-matrix.md) and [references/field-restrictions.md](references/field-restrictions.md) when you need the contract details.

### 4. Build the payload with the canonical fields

- `company.resolve_and_publish` uses `company.input`
- `company.direct_publish` uses `company.publish_payload`
- `job.resolve_and_publish` uses `job.input`
- `job.direct_publish` uses `job.publish_payload`
- optional `job.subtorre` lives directly under `job`
- `job.input.sharer_gg_id` is the sharer field for `job.resolve_and_publish`
- `job.publish_payload.opportunity.sharers` is the sharer field for `job.direct_publish`

Open [references/payload-examples.md](references/payload-examples.md) for request bodies.

### 5. Run `direct_publish` fallback after resolve failure

Use this only after a `resolve_and_publish` request reaches a terminal failure or returns an error that means the API could not assemble one side. Do not use it when the source is weak, the job is closed, the company identity is ambiguous, or Torre rejected a direct payload that was already submitted.

Hard rule: a recoverable resolve failure is not finished until you either run a browser/source remediation pass or record why browser remediation is impossible. URL rewriting, blind retries, and another `resolve_and_publish` request do not count as fallback.

1. Preserve the failed request evidence:
   - original `request_id`
   - terminal state or error
   - company and job input used
   - source URLs and raw content
2. Decide which side failed:
   - company failed before Torre organization was available: build `company.publish_payload` and retry with `company.direct_publish`
   - company succeeded and returned `torre_id`, but job failed: keep `company.resolve_and_publish` with `company.input.torre_id` and build `job.publish_payload`
   - both failed but both source blocks are strong: build both direct payloads and use `company.direct_publish + job.direct_publish`
3. Run browser/source remediation for each recoverable failed row:
   - open the exact canonical job URL in Chrome, a connected browser, or the browser tool available in the current agent
   - follow redirects to the stable role page
   - close login, cookie, and overlay interruptions when possible
   - extract fresh `snapshot_text`, `snapshot_html`, page title, canonical URL, and visible company signals
   - if the browser cannot access the page, try the public ATS/API source only when it returns the full job description
   - if neither browser nor source API exposes enough role content, mark `manual_review` with the blocker
4. Build fallback payloads from the extraction references:
   - company: use [references/company-direct-publish-prompt.md](references/company-direct-publish-prompt.md)
   - job: use [references/job-direct-publish-prompt.md](references/job-direct-publish-prompt.md)
5. Submit the fallback with a new `request_id`. Do not reuse the failed request id because the body shape changed.
6. Record the fallback result separately from the first resolve attempt so the run can report both first-pass effectiveness and final effectiveness.

Treat these resolve failures as recoverable until browser remediation proves otherwise:

- timeout while fetching the role page
- missing opportunity id
- extraction failed or empty extracted payload
- location/place validation mismatch
- weak job text from a redirect or listing page

Do not mark a recoverable row as final `failed` while it still has a readable role page that has not been opened and converted into a direct payload.

### 6. Submit and poll carefully

```bash
curl -X POST "$TORRE_API_URL/crawling/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TORRE_API_KEY" \
  -d '{...}'
```

For async requests:

```bash
sleep 2
curl "$TORRE_API_URL/crawling/ingest/status/<request-id>" \
  -H "Authorization: Bearer $TORRE_API_KEY"
```

- Any request that includes `resolve_and_publish` is asynchronous.
- `company.direct_publish` is synchronous only when `job` is omitted.
- `company.direct_publish + job.direct_publish` is synchronous.
- Never poll the status endpoint faster than once per second.
- Prefer `2000-5000ms` between polls for long-running or batched work.
- Stop polling once you see a terminal request state.
- For more than a few jobs, do not loop `POST` requests from this skill. Route to `torre-operate-external-job-batches` and follow its batch pacing example.

## Guardrails

- Do not publish every row from a listing page unless the user explicitly asked for all of them.
- Do not skip the company-resolution step just because a third-party board page contains a company name.
- Do not choose `direct_publish` unless the payload is already Torre-ready.
- Do not send `careers_url` alone for `company.resolve_and_publish`.
- Do not send third-party listing pages as the company website unless the user explicitly wants them stored only as supporting metadata.
- Do not remove `job_url` when manual content is also present.
- Do not invent a top-level `job.sharer_gg_id`; use:
  - `job.input.sharer_gg_id` for `job.resolve_and_publish`
  - `job.publish_payload.opportunity.sharers` for `job.direct_publish`
- Do not put `subtorre` inside `job.input` or `job.publish_payload`; use `job.subtorre`.
- Do not reuse the same `request_id` with a different payload.

## Quick Reference

| Situation | Action |
| --- | --- |
| Large or long-running run | Use `torre-operate-external-job-batches` |
| Listing page or search results | Use `torre-select-external-jobs` first |
| Selected jobs but weak company or job URLs | Use `torre-resolve-external-job-context` |
| Only company should be published | Omit `job` |
| Both entities still need resolution | `resolve_and_publish + resolve_and_publish` |
| Company is Torre-ready, job is not | `company.direct_publish + job.resolve_and_publish` |
| Company is not resolved, job is Torre-ready | `company.resolve_and_publish + job.direct_publish` |
| Both payloads are Torre-ready | `company.direct_publish + job.direct_publish` |
| Resolve failed but source is trustworthy | Build direct fallback payload and retry with new `request_id` |
| Any async request | Poll no faster than every `1000ms` |
| Many jobs need publication | Use the batch skill's paced API example instead of a local request loop |

## Common Mistakes

- Using `news.ycombinator.com/jobs` or a YC job index URL as the company website
- Treating the source page as the canonical job URL without checking the role page
- Asking the user for full job payloads before first trying to resolve the selected jobs from the provided source
- Forgetting to mention `sharer_gg_id` as an available default configuration
- Ignoring the company-only path when `job` is intentionally absent
- Marking a trustworthy resolve failure as final before trying the `direct_publish` fallback
- Reusing the failed resolve `request_id` for a fallback request with a different payload
- Retrying `resolve_and_publish` in bulk and calling that fallback
- Ending a batch with recoverable failures before opening the failed jobs in a browser/source remediation pass
- Running a large publication batch without a persistent queue/report

## References

- [references/strategy-matrix.md](references/strategy-matrix.md)
- [references/field-restrictions.md](references/field-restrictions.md)
- [references/payload-examples.md](references/payload-examples.md)
- [references/company-direct-publish-prompt.md](references/company-direct-publish-prompt.md)
- [references/job-direct-publish-prompt.md](references/job-direct-publish-prompt.md)
