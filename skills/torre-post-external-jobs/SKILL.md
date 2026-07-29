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
- `default_direct_publish_subject_id`: Default to `1529406` (`torreBotCrawler`) for `job.direct_publish` unless the user explicitly provides another crawler-enabled subject.
- `default_sharer_gg_id`: Reuse for every selected job unless the user overrides it per job.
- `default_subtorre`: Optional default subtorre slug for selected jobs.
- `status_poll_interval_ms`: Default to `2000`. Never poll faster than `1000`.

If the user has not mentioned `sharer_gg_id`, surface it early as an available option before the first publishable request is built. Keep the direct-publish subject and the sharer separate: the subject is the crawler-enabled publishing actor, while the sharer is attribution.

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
- For redirect, bridge, wrapper, aggregator, or shortlink sources, follow only clean HTTP redirects before building the request.
- Spider accepts an HTTP redirect chain only when every 3xx hop has a usable
  HTTP(S) `Location`, the chain does not loop, and it stays within the hop limit.
- If the final page is a verified role page, use that final URL as `job.input.job_url`; keep the original wrapper only in metadata or as `job.input.external_application_url` when it is intentionally the public application link.
- If Spider rejects the HTTP chain, preserve its `redirect_not_acceptable`
  reason. If a `200` page still requires a click, login, search, or form, treat
  it as an unverified wrapper and mark `manual_review`; do not invent a Spider
  redirect error.
- If trustworthy job content exists but no trustworthy canonical job URL exists, use `raw_text` or `raw_html` and do not invent a URL.
- When Spider should acquire the current page, omit `source_preference` or use
  `source_preference: "url"`.
- When Chrome or another trusted browser already captured the canonical detail
  page, use `source_preference: "provided"` with complete `raw_html` or
  `raw_text`. Spider still resolves `job_url` for canonicalization and
  deduplication, while the provided evidence becomes the source-ready snapshot.
- Manual content must preserve compensation, location, commitment,
  requirements, application instructions, and structured job data.
- When the source page exposes structured job data such as JSON-LD, preserve it in `raw_html` or in the captured source evidence. Structured salary/location fields are often cleaner than visible page prose and should not be discarded.

Use `torre-resolve-external-job-context` before choosing the request strategy.

### 3. Choose the right request shape and strategy

- Use `company.resolve_and_publish + job.resolve_and_publish` by default when both sides still need resolution.
- Use `company.resolve_and_publish` without `job` for company-only requests.
- Use `company.direct_publish` only when the organization payload is already Torre-ready.
- Use `job.direct_publish` only when the opportunity payload is already
  Discovery-ready for `SaveFullOpportunityDTO`, including place, strengths,
  organizations, details, members, arrays, compensation, and deadline where
  applicable, before this workflow begins.
- If the company is already known in Torre and you have `torre_id`, prefer `company.resolve_and_publish` with that identifier before considering `company.direct_publish`.
- If complete browser evidence and `job_url` are both available, keep both and
  set `job.input.source_preference: "provided"`.
- Do not switch to `job.direct_publish` only to control whether the opportunity is marked as crawled. `job.resolve_and_publish` accepts optional `job.input.crawled`; omitting it keeps the default as `true`.
- Treat a source-related `resolve_and_publish` failure as a browser-remediation
  event. Capture complete evidence and submit one new
  `resolve_and_publish` request with `source_preference: "provided"`. If the
  shared Spider pipeline still cannot produce a valid job, use
  `manual_review`; do not assemble a parallel Torre payload.

Open [references/strategy-matrix.md](references/strategy-matrix.md) and [references/field-restrictions.md](references/field-restrictions.md) when you need the contract details.

### 4. Build the payload with the canonical fields

- `company.resolve_and_publish` uses `company.input`
- `company.direct_publish` uses `company.publish_payload`
- `job.resolve_and_publish` uses `job.input`
- `job.direct_publish` uses `job.publish_payload`
- optional `job.subtorre` lives directly under `job`
- `job.input.sharer_gg_id` is the sharer field for `job.resolve_and_publish`
- `job.input.source_preference` accepts `url` (default) or `provided`.
  `provided` requires non-empty `raw_html` or `raw_text`.
- `job.publish_payload.subjectId` is required for `job.direct_publish`; prefer `default_direct_publish_subject_id` (`1529406`) unless another subject is explicitly confirmed as crawler-enabled.
- `job.publish_payload.opportunity.sharers` is the sharer field for `job.direct_publish`
- `job.input.crawled` is optional for `job.resolve_and_publish`; omit it unless the operator or source explicitly provides a boolean. Omitted means the API defaults the final opportunity to `crawled: true`.
- `job.publish_payload.opportunity.crawled` is optional for `job.direct_publish`; omit it for the same default, and preserve an explicit boolean when provided.
- `job.publish_payload.opportunity.members` is optional for `job.direct_publish`, but when present it must be an array of Torre-ready member objects, not raw ggIds or names. If you cannot build valid member objects, send `members: []`.
- Each direct-publish member object must include a non-empty `ggId` plus
  `manager`, `poster`, `member`, `status`, `visible`, and `position`. Spider's
  direct validator accepts `status: "pending"` or `"accepted"`; use
  `"accepted"` only for confirmed members.
- `job.publish_payload.opportunity.opportunity` may be `employee`,
  `flexible-job`, `intern`, or `part-time` for direct publish.
- For direct publish, `hybrid` uses `remote: true`, `anywhere: false`,
  `timezone: false`, and a concrete work location. `physical_location` uses
  `remote: false`, `anywhere: false`, `timezone: false`, and a concrete work
  location.

Open [references/payload-examples.md](references/payload-examples.md) for request bodies.

### 5. Remediate source failures through the shared Spider pipeline

Use browser remediation only when the first `resolve_and_publish` request used
URL acquisition, weak content, stale content, or a blocked source. Do not use it
to override a business skip with guessed fields.

If the first request already used complete evidence with
`source_preference: "provided"`, do not resubmit the same evidence. Record
`manual_review` with Spider's terminal reason.

For the same canonical job, allow at most:

1. the first normal `resolve_and_publish` request
2. one remediated `resolve_and_publish` request with complete evidence and
   `source_preference: "provided"`

For the remediated request:

1. Preserve the original request id, terminal result, source URLs, and input.
2. Open the exact canonical detail URL in Chrome or another trusted browser.
3. Capture complete rendered HTML when possible, including JSON-LD, location,
   work mode, compensation, requirements, and application instructions.
4. Keep `job_url` for canonicalization and application routing.
5. Submit a new request id with `job.resolve_and_publish`,
   `source_preference: "provided"`, and the complete evidence.
6. Keep `company.resolve_and_publish` with a known `torre_id` when available.
   The documented company timeout workaround remains separate and does not
   authorize constructing a job payload.

If the provided-evidence request still fails place validation, extraction,
strengths, or another shared posting contract, record `manual_review` with the
source evidence and Spider reason. Do not build `job.publish_payload`,
`opportunity.place`, or `opportunity.strengths` in the agent.

Open [references/place-validation-workaround.md](references/place-validation-workaround.md)
for place-specific review rules.

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
- Do not choose `direct_publish` unless the payload is already
  Discovery-ready. Use the full contract in
  [references/field-restrictions.md](references/field-restrictions.md), not a
  thin objective+URL payload.
- Do not send `careers_url` alone for `company.resolve_and_publish`.
- Do not send third-party listing pages as the company website unless the user explicitly wants them stored only as supporting metadata.
- Do not assume supplied content overrides URL acquisition. Set
  `job.input.source_preference: "provided"` explicitly when complete trusted
  browser evidence should be used.
- Do not remove source location evidence to bypass place validation.
- Do not invent a top-level `job.sharer_gg_id`; use:
  - `job.input.sharer_gg_id` for `job.resolve_and_publish`
  - `job.publish_payload.opportunity.sharers` for `job.direct_publish`
- Do not copy the sharer or member GGID into `job.publish_payload.subjectId`. Direct publish is rejected with `User is not an crawler` when `subjectId` is not crawler-enabled. Use `1529406` by default and keep the person's GGID in `opportunity.sharers`.
- Do not put `subtorre` inside `job.input` or `job.publish_payload`; use `job.subtorre`.
- Do not force `crawled: true` when the operator or source explicitly provided `crawled: false`.
- Do not place `members` at the top level of `job.publish_payload`; it belongs at `job.publish_payload.opportunity.members`.
- Do not send `members` as `["ggid"]`, `{ "ggId": "..." }`, or partial objects missing required booleans/status/position. Use full member objects or `members: []`.
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
| URL/source resolution failed but browser evidence is trustworthy | Retry once with `source_preference: "provided"` and a new `request_id` |
| Any async request | Poll no faster than every `1000ms` |
| Many jobs need publication | Use the batch skill's paced API example instead of a local request loop |

## Common Mistakes

- Using `news.ycombinator.com/jobs` or a YC job index URL as the company website
- Treating the source page as the canonical job URL without checking the role page
- Asking the user for full job payloads before first trying to resolve the selected jobs from the provided source
- Forgetting to mention `sharer_gg_id` as an available default configuration
- Ignoring the company-only path when `job` is intentionally absent
- Marking a source-related resolve failure as final before one
  provided-evidence remediation attempt
- Reusing the failed resolve `request_id` for a remediated request
- Building `job.publish_payload`, `place`, or `strengths` in the agent after a
  shared Spider pipeline failure
- Ending a batch with recoverable failures before opening the failed jobs in a browser/source remediation pass
- Running a large publication batch without a persistent queue/report
- Choosing `job.direct_publish` only because a non-crawled opportunity is needed; `job.resolve_and_publish` can receive optional `job.input.crawled: false`
- Sending malformed `job.publish_payload.opportunity.members`; use full member
  objects with a non-empty `ggId`, or an empty array when no valid members are
  available

## References

- [references/strategy-matrix.md](references/strategy-matrix.md)
- [references/field-restrictions.md](references/field-restrictions.md)
- [references/payload-examples.md](references/payload-examples.md)
- [references/company-direct-publish-prompt.md](references/company-direct-publish-prompt.md)
- [references/company-enrichment-timeout-workaround.md](references/company-enrichment-timeout-workaround.md)
- [references/place-validation-workaround.md](references/place-validation-workaround.md)
