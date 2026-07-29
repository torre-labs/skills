# Payload Examples

These are minimal, high-signal request bodies for:

- `POST $TORRE_API_URL/crawling/ingest`

Use `TORRE_API_URL=https://crawl.torre.ai/api` by default unless the operator explicitly asks for another environment.

## Curl Template

```bash
curl -X POST "$TORRE_API_URL/crawling/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TORRE_API_KEY" \
  -d '{...}'
```

For asynchronous requests:

```bash
sleep 2
curl "$TORRE_API_URL/crawling/ingest/status/<request-id>" \
  -H "Authorization: Bearer $TORRE_API_KEY"
```

The same `TORRE_API_KEY` must be active for both the submit and status calls. If the key is invalid or has been deactivated, the API returns `401 Unauthorized`.

## 1. `direct_publish + direct_publish`

```json
{
  "company": {
    "strategy": "direct_publish",
    "publish_payload": {
      "name": "Acme Labs",
      "websiteUrl": "https://acme.com",
      "identifierLink": "https://www.linkedin.com/company/acme-labs/",
      "flags": {
        "serviceType": "free"
      }
    }
  },
  "job": {
    "strategy": "direct_publish",
    "publish_payload": {
      "subjectId": 1529406,
      "opportunity": {
        "opportunity": "employee",
        "objective": "Senior Backend Engineer",
        "intent": "post-job",
        "crawled": true,
        "crawledSource": "external",
        "published": true,
        "locale": "en",
        "externalApplicationUrl": "https://jobs.acme.com/backend-engineer",
        "externalId": null,
        "deadline": {
          "type": "never"
        },
        "agreement": {
          "type": "employment-contract",
          "currencyTaxes": ""
        },
        "commitment": {
          "code": "full-time",
          "hours": 40
        },
        "timezones": [],
        "strengths": [
          {
            "id": 12345,
            "term": "Backend development",
            "proficiency": "proficient",
            "suggested": true
          }
        ],
        "organizations": [
          {
            "id": 123456,
            "code": 123456,
            "name": "Acme Labs",
            "size": 1,
            "professionalHeadline": null
          }
        ],
        "languages": [],
        "place": {
          "remote": true,
          "anywhere": true,
          "timezone": false,
          "locationType": "remote_anywhere",
          "location": []
        },
        "details": [
          {
            "code": "responsibilities",
            "content": "<p>Acme Labs is hiring a Senior Backend Engineer to build APIs, async systems, and platform services.</p>"
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
  }
}
```

## 2. `direct_publish + resolve_and_publish`

```json
{
  "company": {
    "strategy": "direct_publish",
    "publish_payload": {
      "name": "Acme Labs",
      "websiteUrl": "https://acme.com",
      "identifierLink": "https://www.linkedin.com/company/acme-labs/",
      "flags": {
        "serviceType": "free"
      }
    }
  },
  "job": {
    "strategy": "resolve_and_publish",
    "input": {
      "job_url": "https://jobs.acme.com/backend-engineer",
      "title_hint": "Senior Backend Engineer",
      "sharer_gg_id": "16180",
      "crawled": false
    }
  }
}
```

## 3. `resolve_and_publish + direct_publish`

```json
{
  "company": {
    "strategy": "resolve_and_publish",
    "input": {
      "name": "Acme Labs",
      "website_url": "https://acme.com",
      "linkedin": "https://www.linkedin.com/company/acme-labs/"
    }
  },
  "job": {
    "strategy": "direct_publish",
    "publish_payload": {
      "subjectId": 1529406,
      "opportunity": {
        "opportunity": "employee",
        "objective": "Senior Backend Engineer",
        "intent": "post-job",
        "crawled": true,
        "crawledSource": "external",
        "published": true,
        "locale": "en",
        "externalApplicationUrl": "https://jobs.acme.com/backend-engineer",
        "externalId": null,
        "deadline": {
          "type": "never"
        },
        "agreement": {
          "type": "employment-contract",
          "currencyTaxes": ""
        },
        "commitment": {
          "code": "full-time",
          "hours": 40
        },
        "timezones": [],
        "strengths": [
          {
            "id": 12345,
            "term": "Backend development",
            "proficiency": "proficient",
            "suggested": true
          }
        ],
        "organizations": [
          {
            "id": 123456,
            "code": 123456,
            "name": "Acme Labs",
            "size": 1,
            "professionalHeadline": null
          }
        ],
        "languages": [],
        "place": {
          "remote": true,
          "anywhere": true,
          "timezone": false,
          "locationType": "remote_anywhere",
          "location": []
        },
        "details": [
          {
            "code": "responsibilities",
            "content": "<p>Acme Labs is hiring a Senior Backend Engineer to build APIs, async systems, and platform services.</p>"
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
  }
}
```

## 4. `resolve_and_publish + resolve_and_publish`

```json
{
  "company": {
    "strategy": "resolve_and_publish",
    "input": {
      "name": "Acme Labs",
      "website_url": "https://acme.com",
      "linkedin": "https://www.linkedin.com/company/acme-labs/",
      "careers_url": "https://jobs.acme.com"
    }
  },
  "job": {
    "strategy": "resolve_and_publish",
    "input": {
      "job_url": "https://jobs.acme.com/backend-engineer",
      "title_hint": "Senior Backend Engineer",
      "sharer_gg_id": "16180"
    }
  }
}
```

## 5. Optional Subtorre Tagging

```json
{
  "company": {
    "strategy": "direct_publish",
    "publish_payload": {
      "name": "Acme Labs",
      "websiteUrl": "https://acme.com"
    }
  },
  "job": {
    "strategy": "direct_publish",
    "subtorre": "remotedev",
    "publish_payload": {
      "subjectId": 1529406,
      "opportunity": {
        "opportunity": "employee",
        "objective": "Senior Backend Engineer",
        "intent": "post-job",
        "crawled": true,
        "crawledSource": "external",
        "published": true,
        "locale": "en",
        "externalApplicationUrl": "https://jobs.acme.com/backend-engineer",
        "externalId": null,
        "deadline": {
          "type": "never"
        },
        "agreement": {
          "type": "employment-contract",
          "currencyTaxes": ""
        },
        "commitment": {
          "code": "full-time",
          "hours": 40
        },
        "timezones": [],
        "strengths": [
          {
            "id": 12345,
            "term": "Backend development",
            "proficiency": "proficient",
            "suggested": true
          }
        ],
        "organizations": [
          {
            "id": 123456,
            "code": 123456,
            "name": "Acme Labs",
            "size": 1,
            "professionalHeadline": null
          }
        ],
        "languages": [],
        "place": {
          "remote": true,
          "anywhere": true,
          "timezone": false,
          "locationType": "remote_anywhere",
          "location": []
        },
        "details": [
          {
            "code": "responsibilities",
            "content": "<p>Acme Labs is hiring a Senior Backend Engineer to build APIs, async systems, and platform services.</p>"
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
  }
}
```

## 6. Company-Only `resolve_and_publish`

```json
{
  "company": {
    "strategy": "resolve_and_publish",
    "input": {
      "name": "Acme Labs",
      "website_url": "https://acme.com",
      "linkedin": "https://www.linkedin.com/company/acme-labs/"
    }
  }
}
```

## 7. Company-Only `direct_publish`

```json
{
  "company": {
    "strategy": "direct_publish",
    "publish_payload": {
      "name": "Acme Labs",
      "websiteUrl": "https://acme.com",
      "identifierLink": "https://www.linkedin.com/company/acme-labs/"
    }
  }
}
```

## 8. Company Fallback After Resolve Failure

Use a new `request_id` because this payload is different from the failed resolve request.

```json
{
  "request_id": "6b4e1d2a-3187-4e2d-9b6f-0ab5c8d1e274",
  "company": {
    "strategy": "direct_publish",
    "publish_payload": {
      "name": "Acme Labs",
      "websiteUrl": "https://acme.com",
      "identifierLink": "https://www.linkedin.com/company/acme-labs/",
      "about": "Acme Labs builds developer infrastructure for distributed teams.",
      "flags": {
        "serviceType": "free"
      }
    }
  },
  "job": {
    "strategy": "resolve_and_publish",
    "input": {
      "job_url": "https://jobs.acme.com/backend-engineer",
      "title_hint": "Senior Backend Engineer",
      "raw_text": "Senior Backend Engineer. Remote, United States. Full-time employment contract. Acme Labs is hiring a Senior Backend Engineer to build APIs, async systems, and platform services. Required skills include Node.js, TypeScript, PostgreSQL, distributed systems, and API design. Compensation is USD 150,000 to USD 180,000 per year. Apply through https://jobs.acme.com/backend-engineer.",
      "sharer_gg_id": "16180"
    }
  }
}
```

## 9. Caller-Supplied Direct Job After Company Resolve Succeeded

Use this only when the caller already has a Discovery-ready job payload. Do not
assemble this payload from browser evidence after a resolve failure.

```json
{
  "request_id": "0dc42caa-89af-4baf-8142-182f7951bb39",
  "company": {
    "strategy": "resolve_and_publish",
    "input": {
      "torre_id": "acme-labs"
    }
  },
  "job": {
    "strategy": "direct_publish",
    "publish_payload": {
      "subjectId": 1529406,
      "opportunity": {
        "opportunity": "employee",
        "objective": "Senior Backend Engineer",
        "intent": "post-job",
        "crawled": true,
        "crawledSource": "external",
        "published": true,
        "locale": "en",
        "externalApplicationUrl": "https://jobs.acme.com/backend-engineer",
        "externalId": null,
        "deadline": {
          "type": "never"
        },
        "agreement": {
          "type": "employment-contract",
          "currencyTaxes": ""
        },
        "commitment": {
          "code": "full-time",
          "hours": 40
        },
        "timezones": [],
        "strengths": [
          {
            "id": 12345,
            "term": "Backend development",
            "proficiency": "proficient",
            "suggested": true
          }
        ],
        "organizations": [
          {
            "id": 123456,
            "code": 123456,
            "name": "Acme Labs",
            "size": 1,
            "professionalHeadline": null
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
            "content": "<p><b>About the role</b></p><p>Acme is hiring a remote Senior Backend Engineer to build APIs, async systems, and platform services.</p>"
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
  }
}
```

## Notes

- Add `request_id` when you want idempotent retries.
- Reuse `request_id` only with the exact same payload.
- Use a new `request_id` for a provided-evidence remediation request.
- If the company is already known in Torre, prefer `company.resolve_and_publish` with `company.input.torre_id`.
- If `job.resolve_and_publish` includes both `job_url` and manual content, keep both.
- Use `source_preference: "provided"` when trusted browser evidence should be
  the source snapshot. It must preserve explicit compensation, location,
  commitment, requirements, application instructions, and structured data.
- For `job.direct_publish`, use `deadline.type: "specific-date"` only when the
  source provides a valid closing date that is today or later. Otherwise use
  `deadline.type: "never"`; never copy a fixed date from documentation.
- Preserve structured job data such as JSON-LD in `raw_html` or source evidence when available.
- `job.input.crawled` is optional for `job.resolve_and_publish`; omit it for the API default of `true`, or send `false` when the operator/source explicitly marks the opportunity as non-crawled.
- `job.publish_payload.opportunity.crawled` is optional for `job.direct_publish`; omit it for the same default, and preserve an explicit boolean already present in a Discovery-ready payload.
- For `job.direct_publish`, `job.publish_payload.opportunity.members` must be
  either `[]` or full member objects. Do not send raw ggIds or partial objects.
  A valid direct-publish member needs a non-empty `ggId`, `manager`, `poster`,
  `member`, `status`, `visible`, and `position`; Spider accepts `pending` or
  `accepted` status.
- If you need explicit sharer attribution:
  - use `job.input.sharer_gg_id` for `job.resolve_and_publish`
  - use `job.publish_payload.opportunity.sharers` for `job.direct_publish`
- If you need subtorre association, send `job.subtorre`.
- Do not send `https://news.ycombinator.com/jobs` or another listing index as the company website or canonical job URL.
- Wait at least `1000ms` between async status checks.
