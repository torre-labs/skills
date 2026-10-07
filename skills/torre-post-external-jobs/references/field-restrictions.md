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
- `external_application_url`
- `externalApplicationUrl` (accepted alias)
- `raw_text`
- `raw_html`

### Canonical fields

- `job_url`
- `raw_text`
- `raw_html`
- `title_hint`
- `language_hint`
- `sharer_gg_id`
- `source_preference`
- `crawled`
- `metadata`

### Content precedence

`source_preference` accepts:

- `url` (default): Spider resolves clean redirects, uses the final URL as the
  canonical local job URL, and acquires the current source snapshot.
- `provided`: requires non-empty `raw_html` or `raw_text`. Spider uses that
  complete caller-provided evidence as the source snapshot while still
  resolving `job_url` for canonicalization, deduplication, and application
  routing.

Caller-provided content uses this order:

1. `raw_html`
2. `raw_text`

### URL and redirect contract

`job_url` must be a verified role source, not a bridge page. Spider's clean
redirect contract is technical: every HTTP 3xx hop must contain a usable
HTTP(S) `Location`, the chain must not loop, and it must remain within Spider's
hop limit.

When the redirect is clean:

- use the final stable role URL as `job_url`
- keep the original wrapper URL only in metadata or as `external_application_url` when it is intentionally the public application link

When an HTTP redirect chain is not clean:

- do not send the wrapper as `job_url`
- do not extract `raw_text` or `raw_html` from the wrapper page
- expect Spider to return `redirect_not_acceptable` with a redirect diagnostic
  such as `redirect_missing_location`, `redirect_invalid_location`,
  `redirect_non_http_location`, `redirect_loop`, or `redirect_too_many_hops`

A page that returns `200` but requires a manual click, login, search, or form is
not an HTTP redirect failure. Do not label it `redirect_not_acceptable` unless
Spider returns that terminal reason. Treat it as an unverified wrapper and use
a final role URL, complete provided evidence, or `manual_review`.

If manual content and `job_url` are both present:

- use `source_preference: "url"` when Spider should fetch the current page
- use `source_preference: "provided"` when a trusted browser already captured
  the complete canonical detail page
- `job_url` stays as the canonical local URL
- `job_url` becomes the final external application URL unless `external_application_url` is explicitly supplied

Provided content must be complete enough to stand alone. Do not send a
short listing snippet, rewritten summary, or truncated description as
`raw_text`. It must preserve role-critical evidence such as compensation,
location, commitment, requirements, and application instructions.

When available, preserve structured job data such as JSON-LD in `raw_html` or source evidence. Prefer sending `raw_html` over summarized `raw_text` when the page includes structured salary, location, or employment fields.

### Practical notes

- If `job_url` is missing, supply complete `raw_html` or `raw_text`. Use
  `external_application_url` when the Torre application URL differs or cannot
  be derived from `job_url`; otherwise the request may finish with
  `missing_external_application_url`.
- Do not use board indexes or listing homepages as `job_url`.
- If the caller wants explicit sharer attribution in this strategy, use `job.input.sharer_gg_id`.
- `job.input.crawled` is an optional boolean. Omit it for the API default of `true`; send `false` only when the operator or source explicitly says the resulting opportunity should not be marked as crawled.
- `crawled` is publication metadata, not a reason to switch away from `resolve_and_publish`.

## `job.direct_publish`

### Container

- Use `job.publish_payload`

### Minimum request contract

- `publish_payload` must be a non-empty object
- `publish_payload.opportunity.externalApplicationUrl` is required

### Discovery-ready contract

Treat this as a Discovery-ready `SaveFullOpportunityDTO`, not just a URL.
Spider normalizes safe empty arrays for `members`, `languages`, `attachments`,
and non-timezone `timezones`, but the caller must already supply the complete
contract. Do not construct it from browser evidence as a resolver fallback.

Required or expected fields:

- `subjectId`: crawler-enabled numeric subject, preferably `1529406`
- `opportunity.opportunity`: one of `employee`, `flexible-job`, `intern`, `part-time`
- `opportunity.objective`: job title, 120 characters or fewer
- `opportunity.intent`: `post-job`
- `opportunity.published`: `true`
- `opportunity.locale`: source content language, e.g. `en` or `es`
- `opportunity.externalApplicationUrl`: canonical role/application URL
- `opportunity.organizations`: the resolved Torre organization, using numeric
  `id` and `code` when the Torre id is numeric
- `opportunity.strengths`: unique skill terms with a valid `proficiency` or
  `experience`; include the numeric Discovery `id` when it is known
- `opportunity.languages`: `[]` or valid language objects
- `opportunity.place`: valid Discovery place object
- `opportunity.details`: valid detail blocks, usually
  `[{ "code": "responsibilities", "content": "<p>...</p>" }]`
- `opportunity.attachments`: `[]` or valid Discovery attachment objects
- `opportunity.members`: `[]` or full member objects when explicit posting
  members are known
- `opportunity.sharers`: include the intended sharer GGID when explicit
  attribution is required
- `opportunity.compensation`: source compensation when present; otherwise a
  truthful `to-be-agreed` object
- `opportunity.deadline`: use `specific-date` only when the source supplies a
  valid date that is today or later; otherwise use `{ "type": "never" }`

Discovery accepts these detail codes: `benefits`, `stock-compensations`,
`crawl-description`, `reason`, `responsibilities`, `requirements`,
`challenges`, `career-path`, `organizations`, `team-culture`,
`team-structure`, `additional`, `defined-length`, `open-ended`,
`engagement-undefined`, `comissions`, `bonuses`, `stocks`,
`health-insurance`, `overtime`, `other`, and deprecated
`application-process`.

### Practical notes

- Use this only when the opportunity payload was already Torre-ready before the
  publication workflow began.
- Spider does not infer `subjectId` for `job.direct_publish`; it forwards the payload to Discovery. Set `publish_payload.subjectId` to the crawler-enabled direct-publish subject, preferably `1529406` (`torreBotCrawler`), unless another subject is explicitly confirmed as crawler-enabled.
- Do not derive `subjectId` from the sharer or posting member. Keep the sharer in `job.publish_payload.opportunity.sharers`; using a non-crawler subject causes Discovery to reject the publish with `User is not an crawler`.
- If the caller wants explicit sharer attribution in this strategy, use `job.publish_payload.opportunity.sharers`.
- `job.publish_payload.opportunity.crawled` is optional. Omit it for the API default of `true`; preserve an explicit boolean when the source payload already provides one.
- `job.publish_payload.opportunity.members` is optional, but Discovery reads it as `SaveMemberDTO[]` when the opportunity is created. If you include it, send an array of objects with:
  - a non-empty `ggId`, which Spider's direct-publish validator requires
  - required flags: `manager`, `poster`, `member`, `visible`
  - required metadata: `status` (`pending` or `accepted`) and `position`
- Do not send a raw array of ggIds, names, profile URLs, or partial `{ "ggId": "..." }` objects. If there are no valid posting members, use `members: []`.
- `leader` is optional in Discovery member objects. Do not make it a required
  field in generated payloads.
- For `employee` or `intern`, include `commitment`. For `full-time`, include at
  least one organization.
- For `part-time` opportunity type, `commitment` is optional unless the source
  explicitly states a commitment; if included with `code: "part-time"`, include
  `hours`.
- Use `compensation.code: "range"` or `"fixed"` only when the source gives
  numeric amounts and a valid `periodicity`; otherwise use `to-be-agreed`.

### Place contract

- `remote_anywhere`: `remote=true`, `anywhere=true`, `timezone=false`,
  `location=[]`, `timezones=[]`
- `remote_timezones`: `remote=true`, `anywhere=false`, `timezone=true`,
  `location=[]`, and exactly two timezone offsets such as
  `["-08:00", "-07:00"]`; convert aliases like `PST`, `PT`, `EST`, `ET`,
  `CET`, or `GMT-5` to explicit offsets before direct publication because the
  direct-publish validator expects offsets
- `remote_countries`: `remote=true`, `anywhere=false`, `timezone=false`, with
  at least one country location containing `id`, `countryCode`, `countryName`,
  and numeric `timezone`
- `hybrid`: `remote=true`, `anywhere=false`, `timezone=false`, with at least
  one concrete work location
- `physical_location`: `remote=false`, `anywhere=false`, `timezone=false`, with
  at least one concrete work location

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
