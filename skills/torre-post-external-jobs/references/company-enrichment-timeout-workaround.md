# Company Enrichment Timeout Workaround

## Symptom

`company.resolve_and_publish` (with `input: {name}` or `input: {name, website_url}`) terminates with:

```
terminal_reason: request_processing_failed
message: "Timed out waiting for company <id> enrichment to reach a terminal state"
```

This has been observed to be intermittent rather than deterministic per company: the same payload against the same company can time out on one attempt and succeed on another. Retrying `resolve_and_publish` with identical input, or with a richer input (adding a verified `website_url`), did not reliably fix it in practice — across repeated test batches, both name-only and name+website attempts against the same stuck rows produced 0% success on some retries and only a handful of successes on others, with no consistent pattern by company.

## Workaround: create the company first via `direct_publish`, then resolve by `torre_id`

Use this only for the exact timeout above. Spider performs no local company
deduplication before calling Torre for `company.direct_publish`; Torre decides
whether the organization is reused or created.

Before applying the workaround:

- Reuse an existing `torre_id` with `company.resolve_and_publish` when one is
   already known.
- Include a verified `websiteUrl` or `identifierLink` whenever it is
   available. Do not invent either value.
- Get explicit operator confirmation before every name-only `company.direct_publish`.
   Without that confirmation, stop at `manual_review` with
   `duplicate_company_risk`.

Then execute the two-request workaround:

1. Submit `company.direct_publish` alone (no `job`), with a minimal payload:

   ```json
   {
     "request_id": "6b4e1d2a-3187-4e2d-9b6f-0ab5c8d1e274",
     "company": {
       "strategy": "direct_publish",
       "publish_payload": { "name": "<company name>", "flags": { "serviceType": "free" } }
     }
   }
   ```

   Add a verified `websiteUrl` or `identifierLink` to `publish_payload` when
   available. Omit those fields rather than guessing. This request is
   synchronous and returns `data.company.torre_id` (check both `torre_id` and
   `torreId` in the response — field casing has varied) immediately. There is
   no async enrichment step here, so nothing to time out on.

2. Take that `torre_id` and submit a second request:

   ```json
   {
     "request_id": "0dc42caa-89af-4baf-8142-182f7951bb39",
     "company": {
       "strategy": "resolve_and_publish",
       "input": { "torre_id": "<id from step 1>" }
     },
     "job": {
       "strategy": "resolve_and_publish",
       "subtorre": "...",
       "input": { "job_url": "...", "title_hint": "...", "sharer_gg_id": "..." }
     }
   }
   ```

   Company identity is now a direct ID lookup instead of a name/website enrichment search, so it cannot get stuck the same way.

This name-only payload is intentionally lighter than the "Required Minimum" in
[company-direct-publish-prompt.md](company-direct-publish-prompt.md) (`name` +
`websiteUrl`/`identifierLink`), which governs the evidence-based fallback for a
company whose identity is otherwise unresolved. Here the company name must
already be trusted from the original source, and the operator must explicitly
accept the duplicate-company risk. Prefer including a verified `websiteUrl` or
`identifierLink`; neither removes the need for approval when the final payload
contains only the name.

## Verified impact

In one batch of 43 rows stuck in `request_processing_failed` after 4 prior `resolve_and_publish` attempts (2 name-only, 2 name+website — all near 0% success), applying this pattern got all 43 companies a `torre_id` synchronously on the first try, and moved 25/43 (58%) to a terminal resolved outcome in the same pass (18 posted, 7 legitimately skipped by Torre for other reasons — e.g. `not_real_job`).

## Tradeoff — read before using

`company.direct_publish` skips Spider's local company deduplication. Torre may
reuse an organization or create a new one, but that decision is opaque to the
caller. A name-only payload can therefore create a duplicate company record for
an organization that already exists under another `torre_id`. This is a real,
observed risk, not a hypothetical. Approval is required for every name-only
request, including one-off use. A batch also requires one explicit approval for
the exact reviewed cohort after its dry-run summary.

## When to use

- Use plain `company.resolve_and_publish {name}` (or `{name, website_url}`) as the first attempt, per the parent skill's default policy.
- Reuse a known `torre_id` before considering a new direct publication.
- If the first attempt terminates with `request_processing_failed` / "Timed out waiting for company enrichment", route to this `direct_publish` → `torre_id` pattern instead of retrying `resolve_and_publish` with the same or enriched input again. Repeated identical retries were not found to resolve it reliably.
- If the final company payload contains only `name`, require explicit operator approval. Without approval, return `manual_review` with `duplicate_company_risk`.
- Use a new `request_id` for each changed request body. Never reuse the failed resolve request id for the direct fallback.
- This pattern avoids the company-enrichment timeout but does not guarantee that the job side succeeds; see [place-validation-workaround.md](place-validation-workaround.md) for place failures after company resolution.
