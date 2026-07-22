# Job Place Validation Failures

## Symptom

`job.resolve_and_publish` terminates with `terminal_reason:
job_pipeline_failed`, `entity: job`, and a place-related error such as:

- `error.invalid.value` for `place`
- `inconsistent place combination for hybrid`
- `inconsistent place combination for physical_location`
- `invalid_concrete_place`
- `error.opportunity.location.does.not.exist`

These errors mean the extracted place could not satisfy Spider's posting and
Discovery validation. Conflicting source signals are common: for example, a
listing header may say Madrid while the body says Tres Cantos, or a single post
may advertise the role in several cities.

## Spider source precedence

When a fetchable `job_url` is present, Spider resolves clean redirects and
acquires the current source from that URL before extraction. Caller-provided
`raw_html` and `raw_text` are auxiliary fallback content only when URL
acquisition fails. Supplying edited `raw_text` alongside a readable `job_url`
does not override the URL snapshot.

Do not remove location evidence from `raw_text`, `raw_html`, structured data,
the title, or the canonical URL to bypass validation. Location and work-mode
signals are candidate-critical source truth.

## Remediation

1. Reopen the canonical role page and capture the current title, organization,
   application URL, work mode, every stated location, and structured
   `JobPosting` data.
2. Reconcile apparent conflicts using explicit source evidence. Do not infer a
   city, country, timezone, remote policy, or work mode that the source does not
   support.
3. Make at most one remediated `job.resolve_and_publish` retry, for no more than
   two resolve attempts total for the canonical job.
4. If place validation still fails, use `job.direct_publish` only when the
   current source supports a complete Discovery-ready payload and an explicit
   valid `opportunity.place`:
   - `remote_anywhere`: `remote=true`, `anywhere=true`, `timezone=false`,
     `location=[]`, `timezones=[]`
   - `remote_timezones`: `remote=true`, `anywhere=false`, `timezone=true`,
     `location=[]`, and exactly two valid timezone offsets
   - `remote_countries`: `remote=true`, `anywhere=false`, `timezone=false`, and
     at least one canonical country location
   - `hybrid`: `remote=true`, `anywhere=false`, `timezone=false`, and at least
     one canonical concrete work location
   - `physical_location`: `remote=false`, `anywhere=false`, `timezone=false`,
     and at least one canonical concrete work location
5. If the source is ambiguous, contradictory, or cannot be mapped to valid
   canonical locations without guessing, stop at `manual_review` with
   `ambiguous_or_uncanonicalizable_place`.

Use a new `request_id` for the direct fallback because its body differs from the
failed resolve request.

## Fidelity verification

Verify the published opportunity before recording the row as successful:

- objective matches the source title
- organization matches the resolved Torre company
- place preserves the source-backed work mode and locations
- external application URL reaches the intended role/application path
- requested Subtorre association is present

If any field differs materially, record `manual_review` rather than counting the
publication as a successful workaround.
