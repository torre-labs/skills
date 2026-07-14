# Company Enrichment Timeout Workaround

## Symptom

`company.resolve_and_publish` (with `input: {name}` or `input: {name, website_url}`) terminates with:

```
terminal_reason: request_processing_failed
message: "Timed out waiting for company <id> enrichment to reach a terminal state"
```

This has been observed to be intermittent rather than deterministic per company: the same payload against the same company can time out on one attempt and succeed on another. Retrying `resolve_and_publish` with identical input, or with a richer input (adding a verified `website_url`), did not reliably fix it in practice — across repeated test batches, both name-only and name+website attempts against the same stuck rows produced 0% success on some retries and only a handful of successes on others, with no consistent pattern by company.

## Workaround: create the company first via `direct_publish`, then resolve by `torre_id`

1. Submit `company.direct_publish` alone (no `job`), with a minimal payload:

   ```json
   {
     "request_id": "...",
     "company": {
       "strategy": "direct_publish",
       "publish_payload": { "name": "<company name>", "flags": { "serviceType": "free" } }
     }
   }
   ```

   This is synchronous and returns `data.company.torre_id` (check both `torre_id` and `torreId` in the response — field casing has varied) immediately. There is no async enrichment step here, so nothing to time out on.

2. Take that `torre_id` and submit a second request:

   ```json
   {
     "request_id": "...",
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

Note: this name-only payload is intentionally lighter than the "Required Minimum" in [company-direct-publish-prompt.md](company-direct-publish-prompt.md) (`name` + `websiteUrl`/`identifierLink`), which governs the evidence-based fallback for a company whose identity is otherwise unresolved. Here the company name is already trusted from the original source and the goal is narrowly to dodge the enrichment timeout, not to assemble a full company profile — the duplicate-company tradeoff below is the accepted cost of that shortcut. Prefer including `websiteUrl` when you already have a verified one; it does not appear to change whether the timeout occurs, but it does still help Torre's own downstream enrichment quality.

## Verified impact

In one batch of 43 rows stuck in `request_processing_failed` after 4 prior `resolve_and_publish` attempts (2 name-only, 2 name+website — all near 0% success), applying this pattern got all 43 companies a `torre_id` synchronously on the first try, and moved 25/43 (58%) to a terminal resolved outcome in the same pass (18 posted, 7 legitimately skipped by Torre for other reasons — e.g. `not_real_job`).

## Tradeoff — read before using

`company.direct_publish` skips whatever matching/dedup `company.resolve_and_publish` would otherwise do. Per [field-restrictions.md](field-restrictions.md), "creation vs reuse is resolved by Torre in this strategy" for `direct_publish` — but that resolution is opaque to the caller. If Torre does not internally match the name against an existing company, this can create a duplicate company record for a company that already exists in Torre under a different `torre_id`. This is a real, observed risk, not a hypothetical — get explicit confirmation from the operator before using this pattern in bulk, and prefer it only after `resolve_and_publish` has already failed with the timeout above, not as a first attempt.

## When to use

- Use plain `company.resolve_and_publish {name}` (or `{name, website_url}`) as the first attempt, per the parent skill's default policy.
- If that attempt terminates with `request_processing_failed` / "Timed out waiting for company enrichment", route to this `direct_publish` → `torre_id` pattern instead of retrying `resolve_and_publish` with the same or enriched input again — repeated identical retries were not found to reliably resolve it, while this pattern reliably avoids the timeout entirely (though it does not guarantee the job side will succeed — see [place-validation-workaround.md](place-validation-workaround.md) for the next most common failure once company enrichment is no longer the blocker).
