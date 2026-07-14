# Job "Place" Validation Failures — Workaround

## Symptom

`job.resolve_and_publish` terminates with `terminal_reason: job_pipeline_failed`, `entity: job`, and one of these error messages:

- `TorreOpportunity error: ... {"obj.opportunity":[{"msg":["error.invalid.value"],"args":["place"]}]}`
- `Validation failed for field prompt_payload.place: inconsistent place combination for hybrid`
- `Validation failed for field prompt_payload.place: inconsistent place combination for physical_location`
- `Validation failed for field torre_payload.place.location: invalid_concrete_place`
- `TorreOpportunity error: ... {"code":"error.opportunity.location.does.not.exist", ...}`

These happen when Torre's own extraction/inference produces a location it cannot validate — most often because the source has two conflicting location signals (e.g. a listing header says "Madrid (Híbrido)" but the body copy says "el lugar de trabajo es Tres Cantos", or a company posts one job across multiple cities: "Ubicaciones: Madrid, Barcelona, Sevilla").

## Mitigation: clean location clues out of `raw_text`

Instead of relying on `job_url` extraction alone, capture the job description yourself and submit it as `job.input.raw_text` with location-identifying lines stripped:

- Drop lines that are only a city/country pair ("Madrid, España"), or labelled ("Location:", "Ubicación:", "Based in:").
- Drop "Remote | City" / "Híbrido | City" style fragments.
- Drop postal codes and multi-city listings ("Ubicaciones: Madrid, Barcelona, Sevilla").
- Keep everything else (responsibilities, requirements, comp, seniority) intact — this is still a full extraction source, not a summary.

Per [field-restrictions.md](field-restrictions.md)'s content precedence (`raw_html` > `raw_text` > `job_url`), a clean `raw_text` takes priority over whatever Torre would otherwise derive from `job_url`. Keep `job_url` in the payload regardless — it remains the canonical/application URL, per the same file.

## Known limitation (verified empirically — not fully solved)

Cleaning `raw_text` alone was not sufficient for every case. In one test batch, 6 of 7 remaining `job_pipeline_failed` rows after this cleanup were still place-related. Two likely additional signal sources that `raw_text` cleaning does not address:

1. **The `job_url` path itself can encode a location segment** that Torre may read independently of `raw_text` — e.g. InfoJobs URLs follow `infojobs.net/<city>/<slug>/<id>`, so the literal string `madrid` is present in the URL even when the description text has been fully scrubbed.
2. **Torre may be resolving location against the company record, not just the job** — e.g. a multinational's registered HQ country vs. the job's local office produces a conflict that no amount of job-description cleaning can fix, since the mismatch is on the company side.

Neither of these has a confirmed fix yet. Untested candidate mitigations for a future pass:
- Try omitting `job_url` entirely when `raw_text` is present, to see whether Torre's place inference stops reading the URL path (would need `raw_text` to be complete enough to stand alone, and loses `job_url` as the extraction source — check whether the API still accepts the request with `job_url` absent and `raw_text` present per [field-restrictions.md](field-restrictions.md)'s minimum-signal rule for `job.resolve_and_publish`).
- For the company-side conflict, there is currently no lever available in `resolve_and_publish` (it has no place-related input field at all); it may require `job.direct_publish` with an explicit `opportunity.place`, per the parent skill's existing fallback guidance for place failures.

## Effectiveness

Applied to 16 `job_pipeline_failed` rows caused by place errors (after the company side was already fixed via [company-enrichment-timeout-workaround.md](company-enrichment-timeout-workaround.md)): 9/16 (56%) resolved.
