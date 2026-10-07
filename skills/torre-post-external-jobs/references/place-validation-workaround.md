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

## Spider source contract

URL acquisition is the default. When a trusted browser captures the complete
canonical detail page, send `source_preference: "provided"` with `raw_html` or
`raw_text`. Spider still resolves `job_url` for canonicalization,
deduplication, and application routing.

Do not remove location evidence from `raw_text`, `raw_html`, structured data,
the title, or the canonical URL to bypass validation. Location and work-mode
signals are candidate-critical source truth.

## Remediation

1. Reopen the canonical role page and capture complete rendered HTML when
   possible, including title, organization, application URL, work mode, every
   stated location, and structured `JobPosting` data.
2. Keep all location and modality evidence intact. Do not infer, rewrite, or
   remove a city, country, timezone, remote policy, or work mode.
3. Submit one new `job.resolve_and_publish` request with a new `request_id`,
   `source_preference: "provided"`, the canonical `job_url`, and the complete
   evidence.
4. If place validation still fails, stop at `manual_review` with Spider's exact
   validation reason and the captured evidence.

If the failed request already used the same complete evidence with
`source_preference: "provided"`, skip step 3 and go directly to
`manual_review`.

Do not build an explicit `opportunity.place` or switch the job to
`job.direct_publish` as remediation. Place assembly and validation belong to
the shared Spider posting pipeline.

## Fidelity verification

Verify the published opportunity before recording the row as successful:

- objective matches the source title
- organization matches the resolved Torre company
- place preserves the source-backed work mode and locations
- external application URL reaches the intended role/application path
- requested Subtorre association is present

If any field differs materially, record `manual_review` rather than counting the
publication as a successful workaround.
