# Job Direct Publish Prompt

Use this reference when `job.resolve_and_publish` failed but the job source is still trustworthy and can be converted into `job.publish_payload`.

This prompt follows the same opportunity-draft rules as the resolve path. The output must be a Torre-ready opportunity payload, not just an extraction draft.

## Inputs

Provide as much of this evidence as is available:

- `subject_id`
- `company_name`
- `company_torre_id`
- `company_website_url`
- `job_url`
- `job_title_hint`
- `snapshot_html`
- `snapshot_text`
- `sharer_gg_id`
- `source_type`, usually `external`
- optional `subtorre`
- any failure reason from the previous resolve attempt

For fallback use, `snapshot_html` and `snapshot_text` should come from the browser/source remediation pass after the failed resolve attempt. Do not rely only on a listing-card snippet when the canonical job page is readable.

## System Prompt

Act as a precise job-post extraction API. Convert the supplied job post into a single Torre-ready `job.publish_payload` JSON object.

Rules:

- Use only evidence present in the job post, source metadata, or supplied operator context.
- Do not invent compensation, location, skills, language requirements, company identifiers, or application URLs.
- Preserve all role-relevant content in `details`.
- Exclude navigation, application forms, cookie banners, legal boilerplate, and repeated page chrome.
- Keep `intent` as `"post-job"`, `crawled` as `true`, `published` as `true`, and `crawledSource` as `"external"` unless the operator provided another valid source type.
- Use `job_url` as `opportunity.externalApplicationUrl` only when it is a canonical role page. Do not use an aggregator/listing index.
- Put the provided sharer under `opportunity.sharers`.
- Return only a single JSON object. Do not include markdown.

## Output Shape

Return a JSON object that can be placed directly under `job.publish_payload`:

```json
{
  "subjectId": 1529406,
  "opportunity": {
    "opportunity": "employee",
    "objective": "Senior Backend Engineer",
    "intent": "post-job",
    "crawled": true,
    "crawledSource": "external",
    "published": true,
    "locale": "en",
    "externalApplicationUrl": "https://jobs.example.com/senior-backend-engineer",
    "externalId": null,
    "deadline": {
      "type": "specific-date",
      "deadline": "2026-05-04T00:00:00.000Z"
    },
    "agreement": {
      "type": "employment-contract"
    },
    "commitment": {
      "code": "full-time"
    },
    "timezones": [],
    "strengths": [],
    "organizations": [
      {
        "id": "company-torre-id",
        "name": "Example Inc"
      }
    ],
    "languages": [],
    "place": {
      "remote": true,
      "anywhere": false,
      "timezone": false,
      "locationType": "remote_countries",
      "location": [
        {
          "id": "United States",
          "countryCode": "US",
          "countryName": "United States",
          "timezone": -5
        }
      ]
    },
    "details": [
      {
        "code": "responsibilities",
        "content": "<p><b>About the role</b></p><p>Explicit role content from the job post.</p>"
      }
    ],
    "attachments": [],
    "members": [],
    "sharers": ["16180"],
    "compensation": {
      "code": "to-be-agreed",
      "currency": null,
      "minAmount": null,
      "maxAmount": null,
      "periodicity": null,
      "visible": false,
      "estimate": false,
      "negotiable": false
    }
  }
}
```

## Required Minimum

The fallback is usable only when the output has:

- `subjectId`
- `opportunity.objective`
- `opportunity.intent`
- `opportunity.externalApplicationUrl`
- `opportunity.organizations` with the resolved Torre organization
- `opportunity.details`
- `opportunity.sharers`
- `opportunity.place`

If the job is closed, non-remote when the run only accepts remote roles, missing a canonical application URL, or lacks enough role text to produce candidate-facing details, do not direct-publish. Return:

```json
{
  "manual_review_reason": "insufficient_job_evidence"
}
```

## Location Rules

- Use `remote_countries` when the job explicitly lists countries, states, or cities as role location.
- Use `remote_timezones` only when no country/city/state is stated and the post gives a region or timezone.
- Use `remote_anywhere` only when the post says worldwide/anywhere/global or says remote with no role-level geography.
- Ignore visa, work authorization, sponsorship, EEO, and application-form questions when deciding the role location.
- Skip direct publish when the job is hybrid or physical and the batch/run is configured for remote-only publication.

## Operator Checks

Before submitting:

- Confirm `externalApplicationUrl` is the canonical role page.
- Confirm `organizations` points to the Torre company created or resolved in the company step.
- Confirm `sharers` contains the intended `sharer_gg_id`.
- Confirm generated `details.content` has candidate-facing role information, not form or legal boilerplate.
- Confirm the evidence came from a current browser/source read of the failed role, or record why that read was impossible.
- Add a new `request_id` because the fallback body differs from the failed resolve request.
