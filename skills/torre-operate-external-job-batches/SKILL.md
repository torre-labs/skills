---
name: torre-operate-external-job-batches
description: Use when a user wants to publish dozens or thousands of external jobs from a browser workflow, a listing page, or a large link set and needs durable queue tracking, resumable progress, and reporting across a long-running Torre ingest run.
---

# Torre Operate External Job Batches

## Overview

Use this skill for long-running batch publication runs.

This skill does not replace per-job selection or resolution. It gives those steps a durable operating model so the work can continue across 200, 1000, or 2000 jobs without losing state.

Use these companion skills inside the run:

- `torre-select-external-jobs`
- `torre-resolve-external-job-context`
- `torre-post-external-jobs`
- a browser capability chosen jointly by the user and the agent when the run starts from browser interaction

## When to Use

- The user wants to publish many jobs from one or more sources
- The source is a browser flow or a listing page with many candidate roles
- The run may outlive one short interaction
- The user needs a resumable queue or an operator report
- The backend load matters and polling/submission must be paced

## Batch Pattern

### 1. Choose the intake mode first

Ask this kickoff question:

`Do you want me to start from a browser flow or from links I can inspect directly?`

If the answer is browser, immediately align on the browser path:

`Do we want to use your connected browser, a browser automation tool available in this agent, or switch to links I can inspect directly?`

Choose:

- `browser`: Use when the work requires navigation, expansion, filters, logins, or extracting links from interactive pages.
- `link`: Use when the user already has a listing URL, a company jobs page, or a link set that can be parsed directly.

If the user chooses browser intake:

- do not assume a specific browser tool
- prefer the browser capability that is actually available and preferred in the current environment
- only mention `playwright` when it is the chosen browser tool for this run
- if neither shared browser access nor a suitable browser tool is available, fall back to link-based intake

### 2. Initialize a durable run folder

Create one folder per run:

`output/torre-batches/<run-id>/`

Recommended `run-id` shape:

`YYYYMMDD-HHMMSS-<source-slug>`

Minimum files:

- `run.md`
- `queue.jsonl`
- `report.md`

Optional support folder:

- `artifacts/`

### 3. Persist the run configuration

Write `run.md` with:

- run goal
- intake mode
- source URLs
- selection filters
- `TORRE_API_URL`, defaulting to `https://crawl.torre.ai/api`
- `default_sharer_gg_id`
- optional `default_subtorre`
- `submission_interval_ms`
- `max_in_flight_submissions`
- `rate_limit_cooldown_ms`
- polling interval
- notes about chunk size or concurrency

If `sharer_gg_id` matters and the user has not provided one, surface that option before the first submission phase.

### 4. Build a queue instead of holding everything in memory

Use `queue.jsonl` with one current-state row per job.

Minimum fields per row:

- `queue_id`
- `source_type`
- `source_url`
- `company_name`
- `job_title`
- `canonical_company_url`
- `canonical_job_url`
- `crawled`
- `request_id`
- `active_source_preference`
- `status`
- `attempts`
- `resolve_request_id`
- `fallback_request_id`
- `fallback_strategy`
- `browser_snapshot_path`
- `fallback_blocked_reason`
- `last_error`
- `last_resolve_error`
- `last_fallback_error`
- `last_status_check_at`

Use `crawled` as a nullable boolean in the queue. Keep it `null` when the source/operator did not specify it, because the ingest API defaults omitted `crawled` values to `true`.

Recommended statuses:

`discovered -> selected -> resolved -> ready -> submitted -> polling -> fallback_ready -> fallback_submitted -> fallback_polling -> posted|skipped|failed|manual_review`

The `fallback_*` fields and statuses are the durable queue schema. Keep these
names when creating or resuming runs so existing queues need no schema
migration. Here, fallback means exactly one provided-evidence
`job.resolve_and_publish` source remediation after the normal resolve attempt.
It never means `job.direct_publish` or an agent-built job payload, place, or
strengths.

`active_source_preference` is the durable mode of the request identified by
`request_id`. Persist it before each submission so polling and resumed runs do
not depend on reconstructing the submitted request.

### 5. Process the queue by phase

#### Discovery

- capture candidate rows from browser or links
- write them as `discovered`

#### Selection

- reduce the candidate set using `torre-select-external-jobs`
- move approved rows to `selected`

#### Resolution

- resolve company identity and canonical URLs with `torre-resolve-external-job-context`
- for HTTP redirect rows, accept only chains where every 3xx hop has a usable
  HTTP(S) `Location`, the chain does not loop, and it stays within Spider's hop
  limit
- preserve `redirect_not_acceptable` when Spider reports that terminal reason;
  use `manual_review` for a `200` wrapper that still requires a click, login,
  search, or form
- move clean rows to `resolved` or `ready`

#### Submission

- submit only `ready` rows
- assign a stable `request_id` per submission
- persist `active_source_preference: "url"` to `queue.jsonl` before the
  first-pass POST, and send the same preference in that request
- default to one in-flight submission at a time
- wait at least `5000ms` between submit attempts unless the user has confirmed a safer backend-specific limit
- when a submit returns `429` or a transient `5xx`, keep the row retryable and pause all submissions for at least `65000ms`
- move rows to `submitted`

#### Polling

- move first-pass async rows to `polling` and provided-evidence fallback rows to
  `fallback_polling`
- read `source_preference` from the persisted `active_source_preference`, and
  read the terminal reason explicitly from `data.error.terminal_reason`; apply
  terminal transitions before generic success or skip handling
- when a provided-evidence request with `source_preference: "provided"` fails
  or returns `completed_with_skips` with
  `terminal_reason: "insufficient_strengths"`, move the row to `manual_review`
  and stop polling; never count it as a final `skipped`, move it back to
  `fallback_ready`, or retry it
- only when a first-pass URL-acquisition resolve request fails and the source is
  still trustworthy, move the row to `fallback_ready` instead of `failed`
- only when a first-pass URL-acquisition request returns `completed_with_skips` with
  `terminal_reason: "insufficient_strengths"` and the source remains
  trustworthy, move the row to `fallback_ready` instead of counting the skip as
  final
- after those rules, update remaining terminal outcomes as `posted`, `skipped`,
  `failed`, or `manual_review`
- update `failed` or `manual_review` only after source remediation has been
  evaluated
- do not make more than two `resolve_and_publish` attempts for the same
  canonical job: one normal attempt and one provided-evidence remediation

#### Fallback (Provided-Evidence Source Remediation)

- for every `fallback_ready` row, run browser/source remediation:
  - open the canonical job URL in Chrome, a connected browser, or the browser tool available in the current agent
  - follow only clean HTTP redirect chains to a stable single-role page
  - set `fallback_blocked_reason` to `redirect_not_acceptable` only when Spider
    reports that terminal reason; otherwise classify an unverified wrapper
    separately as `manual_review`
  - capture the final URL, page title, complete rendered job text, HTML, and
    structured job data such as JSON-LD when available
  - save the evidence under `artifacts/` and write its path to `browser_snapshot_path`
  - if browser access is blocked, try the public ATS/API source only when it returns the full job description
  - if neither source exposes enough role content, set
    `fallback_blocked_reason` and move the row to `manual_review`
- submit the complete capture through `job.resolve_and_publish` with the
  canonical `job_url`, `source_preference: "provided"`, and `raw_html` or
  `raw_text`
- never use `job.direct_publish` for this fallback
- do not build `job.publish_payload`, `opportunity.place`, or
  `opportunity.strengths` in the batch operator
- for a company-enrichment timeout, reuse a known `torre_id`; if only a
  name-only company payload remains, move the row to `manual_review` until the
  operator explicitly approves that duplicate-company risk
- for place/location validation failures, preserve all location and modality
  evidence; if Spider still rejects the provided-evidence request, move the row
  to `manual_review`
- assign a new `fallback_request_id`; never reuse `resolve_request_id` with a different body
- set `request_id` to the active fallback id while preserving
  `resolve_request_id` for first-pass reporting
- persist `active_source_preference: "provided"` to `queue.jsonl` before the
  fallback POST, and send the same preference in that request
- set `fallback_strategy` to `provided_evidence_resolve`
- move rows to `fallback_submitted` or `fallback_polling`
- preserve the first-pass failure in `last_resolve_error`
- preserve source-remediation failures separately in `last_fallback_error`
- count first-pass resolve effectiveness and final effectiveness separately in `report.md`
- a batch is not complete while any row remains in `fallback_ready`,
  `fallback_submitted`, or `fallback_polling`
- if more than 10% of selected jobs fail first-pass resolve, pause broad retries and run the browser remediation pass on a representative chunk before continuing

### 6. Checkpoint after every chunk

Do not wait until the end of the run.

After each chunk, update:

- `queue.jsonl`
- `report.md`
- `run.md` notes when the operating plan changes

This is what makes the run resumable.

### 7. Resume from persisted state

When the run restarts:

- reload `queue.jsonl`
- skip terminal rows
- continue only rows still in non-terminal states
- preserve each row's `request_id`, `active_source_preference`, `attempts`, and
  latest known error context
- normalize legacy in-flight rows that lack `active_source_preference` before
  polling: infer `"provided"` for `fallback_submitted` and `fallback_polling`,
  infer `"url"` for `submitted` and `polling`, and persist the inferred value
  back to `queue.jsonl`

## Queue File Pattern

Example row:

```json
{
  "queue_id": "hn-20260421-0001",
  "source_type": "listing_page",
  "source_url": "https://news.ycombinator.com/jobs",
  "company_name": "Acme Labs",
  "job_title": "Senior Backend Engineer",
  "canonical_company_url": "https://acme.com",
  "canonical_job_url": "https://jobs.acme.com/backend-engineer",
  "crawled": null,
  "request_id": "a6f5b64f-7a5f-4f1d-8e4c-0f26d6df4f52",
  "active_source_preference": "url",
  "resolve_request_id": "a6f5b64f-7a5f-4f1d-8e4c-0f26d6df4f52",
  "fallback_request_id": null,
  "fallback_strategy": null,
  "browser_snapshot_path": null,
  "fallback_blocked_reason": null,
  "status": "polling",
  "attempts": 1,
  "last_error": null,
  "last_resolve_error": null,
  "last_fallback_error": null,
  "last_status_check_at": "2026-04-21T16:05:00Z"
}
```

## Reporting Pattern

Keep `report.md` human-readable. Update counts such as:

- discovered
- selected
- resolved
- ready
- submitted
- polling
- fallback_ready
- fallback_submitted
- fallback_polling
- posted
- skipped
- failed
- manual_review

Include these effectiveness metrics:

- first-pass posted rate from `resolve_and_publish`
- fallback provided-evidence remediation attempted count
- fallback posted rate
- fallback blocked count and reasons
- final posted rate after fallback

Also keep short sections for:

- current source and filters
- latest successful chunk
- repeated failure reasons
- repeated fallback failure reasons
- browser/source remediation coverage
- items needing manual follow-up

## Rate and Load Guardrails

- Treat a batch as a durable queue of paced API calls, not as permission to fire many requests at once.
- Default `max_in_flight_submissions` to `1`.
- Default `submission_interval_ms` to `5000`.
- Default `rate_limit_cooldown_ms` to `65000`.
- Never poll the status endpoint faster than once per second.
- Prefer `2000-5000ms` between polls for large runs.
- Keep submission concurrency intentionally conservative; increase it only when the user confirms the backend can absorb it.
- Do not fire unbounded status loops against the same backend.
- Do not run multiple batch workers against the same backend unless the user explicitly confirms the intended combined rate.
- If any request returns `429`, treat it as backend pressure, not as a job failure. Slow the whole run before retrying.
- Stop polling a row as soon as it reaches a terminal state.

## Batch API Pacing Example

Batch publishing should use the normal ingest API from a queue. Do not build one huge burst of parallel `POST` requests unless Torre.ai provides a dedicated bulk endpoint and the user confirms that endpoint should be used.

Use this operating shape for batch submissions:

```js
const SUBMISSION_INTERVAL_MS = 5000;
const STATUS_POLL_INTERVAL_MS = 5000;
const RATE_LIMIT_COOLDOWN_MS = 65000;
const MAX_IN_FLIGHT_SUBMISSIONS = 1;

for (const row of readyRows) {
  await waitForAvailableSubmissionSlot(MAX_IN_FLIGHT_SUBMISSIONS);
  await persistQueuePatch(row, { active_source_preference: "url" });

  const response = await postJson(`${TORRE_API_URL}/crawling/ingest`, {
    request_id: row.request_id,
    company: row.company,
    job: {
      ...row.job,
      input: {
        ...row.job.input,
        source_preference: row.active_source_preference
      }
    }
  });

  if (response.status === 429) {
    markRetryable(row, response);
    await sleep(RATE_LIMIT_COOLDOWN_MS);
    continue;
  }

  recordSubmissionResult(row, response);
  await sleep(SUBMISSION_INTERVAL_MS);
}
```

Use this operating shape for status checks:

```js
for (const row of pollingRows) {
  const response = await getJson(
    `${TORRE_API_URL}/crawling/ingest/status/${row.request_id}`
  );

  if (response.status === 429) {
    keepPollingLater(row, response);
    await sleep(RATE_LIMIT_COOLDOWN_MS);
    continue;
  }

  const terminalReason = response.data?.error?.terminal_reason ?? null;
  updateTerminalStateIfReady(row, response, {
    sourcePreference: row.active_source_preference,
    terminalReason
  });
  await sleep(STATUS_POLL_INTERVAL_MS);
}
```

This example is intentionally sequential. If a run needs more throughput, first reduce repeated polling, then increase chunk size carefully, and only then consider more submission concurrency with explicit user confirmation.

## Quick Reference

| Situation | Action |
| --- | --- |
| User gives one or a few jobs | Stay in `torre-post-external-jobs` |
| User gives a listing with many jobs | Start a batch run |
| Source requires clicks or browser state | Use `browser` intake with the user-approved browser capability |
| Source is directly inspectable by URL | Use `link` intake |
| Run is interrupted | Resume from `queue.jsonl` |
| Backend is under pressure | Slow polling and reduce chunk size |
| Any request returns `429` | Pause the whole run, keep the row retryable, and retry later |
| URL/source resolve fails but source is trustworthy | Move row to `fallback_ready` and retry once with complete provided evidence |
| Many rows fail with timeout, missing opportunity id, extraction failure, or validation errors | Open failed jobs in browser/source remediation and send the captures through Spider |

## Common Mistakes

- Starting a 200+ job run without a persistent queue file
- Keeping progress only in the chat context
- Mixing source URLs and canonical URLs
- Polling every request too aggressively
- Treating a batch as parallel API submission by default
- Retrying immediately after a `429`
- Reprocessing already terminal rows on resume
- Publishing before the queue has a confirmed selected set
- Assuming `playwright` is always the right browser path
- Treating the durable fallback path as `job.direct_publish` or building direct
  job payloads instead of sending one complete provided-evidence remediation
  through the shared Spider pipeline
- Ending the run with recoverable failed rows that were never opened in browser/source remediation
