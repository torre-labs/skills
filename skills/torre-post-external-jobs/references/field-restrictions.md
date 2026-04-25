# Field Restrictions

Use this file when you need the public request contract for:

- `POST $TORRE_API_URL/crawling/ingest`
- `GET $TORRE_API_URL/crawling/ingest/status/<request-id>`

Default `TORRE_API_URL` to `https://crawl.torre.ai/api`. Only override it for an explicitly provided alternate environment.

Clients should use the canonical field names documented here.

## Top-Level Rules

- `company` is required.
- `job` is optional.
- `company.strategy` is required.
- `job.strategy` is required only when `job` is present.
- Allowed strategy values:
  - `resolve_and_publish`
  - `direct_publish`
- `request_id` is optional and is intended for idempotent retries.
- Reusing the same `request_id` with a different payload should be treated as invalid.
- Company-only requests are valid.

## `company.resolve_and_publish`

### Container

- Use `company.input`

### Minimum useful signal

At least one strong identifier must be present:

- `name`
- `domain`
- `website_url`
- `linkedin`
- `torre_id`

### Canonical fields

- `name`
- `domain`
- `website_url`
- `linkedin`
- `careers_url`
- `torre_id`
- `serviceType`
- `logo_url`
- `description`
- `industry`
- `company_size`
- `headquarters`
- `full_address`
- `city`
- `state`
- `country`
- `postal_code`
- `metadata`

### Practical notes

- `careers_url` is useful context, but should not be the only identifier.
- Third-party listing pages are source evidence, not the preferred company website.
- If `torre_id` is known for an already published company, that is the preferred shortcut for this strategy.

## `company.direct_publish`

### Container

- Use `company.publish_payload`

### Minimum request contract

- `publish_payload` must be a non-empty object

### Practical minimum

```json
{
  "name": "Acme Labs",
  "websiteUrl": "https://acme.com",
  "identifierLink": "https://www.linkedin.com/company/acme-labs/",
  "flags": {
    "serviceType": "free"
  }
}
```

### Behavioral notes

- Use this only when the company payload is already Torre-ready.
- Creation vs reuse is resolved by Torre in this strategy.

## `job.resolve_and_publish`

### Container

- Use `job.input`

### Minimum useful signal

At least one of these must be present:

- `job_url`
- `raw_text`
- `raw_html`

### Canonical fields

- `job_url`
- `raw_text`
- `raw_html`
- `title_hint`
- `language_hint`
- `sharer_gg_id`
- `metadata`

### Content precedence

The extraction source of truth is:

1. `raw_html`
2. `raw_text`
3. `job_url`

If manual content and `job_url` are both present:

- extraction uses the manual content
- `job_url` stays as the canonical URL
- `job_url` becomes the final external application URL

### Practical notes

- If `job_url` is missing, the request may still process the job but cannot publish it.
- Do not use board indexes or listing homepages as `job_url`.
- If the caller wants explicit sharer attribution in this strategy, use `job.input.sharer_gg_id`.

## `job.direct_publish`

### Container

- Use `job.publish_payload`

### Minimum request contract

- `publish_payload` must be a non-empty object
- `publish_payload.opportunity.externalApplicationUrl` is required

### Practical minimum

Treat this as a Torre-ready payload, not just a URL. In practice that usually includes:

- `subjectId`
- `opportunity.objective`
- `opportunity.intent`
- `opportunity.externalApplicationUrl`
- `opportunity.sharers` when the caller wants explicit sharer attribution

### Practical notes

- Use this only when the opportunity payload is already Torre-ready.
- If the caller wants explicit sharer attribution in this strategy, use `job.publish_payload.opportunity.sharers`.

## `job.subtorre`

### Container

- Use `job.subtorre`

### Contract

- Optional
- Must be a non-empty string
- Applies to both `job.resolve_and_publish` and `job.direct_publish`

### Behavioral notes

- This field is endpoint-level metadata.
- Do not place it inside `job.input`.
- Do not place it inside `job.publish_payload`.
- If supplied, the API will try to associate the published opportunity with that subtorre after job publication succeeds.

## Sync, Async, and Error Transport

- If either side uses `resolve_and_publish`, the request is asynchronous.
- `company.direct_publish` is synchronous when `job` is omitted.
- `company.direct_publish + job.direct_publish` is synchronous.
- In synchronous direct/direct requests, provider errors return inline.
- In asynchronous requests, inspect the status endpoint.

## Client Polling Guidance

- Wait at least `1000ms` between async status checks.
- Prefer `2000-5000ms` between polls for long-running or batched work.
