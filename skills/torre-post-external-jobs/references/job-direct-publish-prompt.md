# Job Direct Publish Prompt

Use this reference when `job.resolve_and_publish` failed but the job source is still trustworthy and can be converted into `job.publish_payload`.

This prompt follows the same opportunity-draft rules as the resolve path. The output must be a Torre-ready opportunity payload, not just an extraction draft.

## Inputs

Provide as much of this evidence as is available:

- `direct_publish_subject_id`, default `1529406` (`torreBotCrawler`) unless another subject is explicitly confirmed as crawler-enabled
- `company_name`
- `company_torre_id`
- `company_website_url`
- `job_url`
- `job_title_hint`
- `snapshot_html`
- `snapshot_text`
- structured job data from the page, such as JSON-LD, when available
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
- If the source contains explicit compensation, including structured salary fields, include it in `opportunity.compensation`; use `to-be-agreed` only when compensation is genuinely absent or non-numeric.
- Keep `intent` as `"post-job"` and `published` as `true`.
- Set `crawled` from an explicit operator/source boolean when provided; otherwise omit it or use `true`. Use `false` only when the operator or source explicitly marks the opportunity as non-crawled.
- Keep `crawledSource` as `"external"` unless the operator provided another valid source type.
- Use `job_url` as `opportunity.externalApplicationUrl` only when it is a canonical role page. Do not use an aggregator/listing index.
- Set top-level `subjectId` to `direct_publish_subject_id`. If no value is supplied, use `1529406`. Never derive `subjectId` from `sharer_gg_id` or a member GGID unless that same subject is explicitly confirmed as crawler-enabled.
- Put the provided sharer under `opportunity.sharers`.
- Put explicit posting members under `opportunity.members` only when they are already Torre-ready member objects. Each member must include a resolvable identity (`ggId`, `subjectId`, `personId`, `contactId`, or `name` plus `email`), `manager`, `poster`, `member`, `status`, `visible`, and `position`.
- Do not output raw ggId arrays or partial member objects. If no valid posting members are supplied, output `"members": []`.
- If the previous resolve attempt ended with `terminal_reason: "insufficient_strengths"`, derive at least one explicit `opportunity.strengths` entry from the current source evidence before submitting. If no source-backed strength can be justified, return `manual_review_reason` instead of direct-publishing.
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
    "members": [
      {
        "ggId": "123456",
        "manager": false,
        "poster": false,
        "member": true,
        "leader": false,
        "status": "accepted",
        "visible": true,
        "position": 0
      }
    ],
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

- Confirm top-level `subjectId` is the crawler-enabled direct-publish subject, preferably `1529406`, not the sharer GGID.
- Confirm `externalApplicationUrl` is the canonical role page.
- Confirm `organizations` points to the Torre company created or resolved in the company step.
- Confirm `sharers` contains the intended `sharer_gg_id`.
- Confirm `members` is `[]` or full valid member objects, never raw ggIds, names, or partial objects.
- Confirm explicit source compensation was not lost. If the source has salary or pay-rate evidence and the payload says `to-be-agreed`, re-check `snapshot_html`, `snapshot_text`, and structured data before submitting.
- Confirm `strengths` is not empty when this is an insufficient-strengths fallback.
- Confirm generated `details.content` has candidate-facing role information, not form or legal boilerplate.
- Confirm the evidence came from a current browser/source read of the failed role, or record why that read was impossible.
- Add a new `request_id` because the fallback body differs from the failed resolve request.
