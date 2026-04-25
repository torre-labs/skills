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
        "objective": "Senior Backend Engineer",
        "intent": "post-job",
        "externalApplicationUrl": "https://jobs.acme.com/backend-engineer",
        "sharers": ["16180"]
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
      "raw_text": "Acme is hiring a remote Senior Backend Engineer to build APIs, async systems, and platform services.",
      "sharer_gg_id": "16180"
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
        "objective": "Senior Backend Engineer",
        "intent": "post-job",
        "externalApplicationUrl": "https://jobs.acme.com/backend-engineer",
        "sharers": ["16180"]
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
        "objective": "Senior Backend Engineer",
        "intent": "post-job",
        "externalApplicationUrl": "https://jobs.acme.com/backend-engineer",
        "sharers": ["16180"]
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
  "request_id": "fallback-company-20260424-0001",
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
      "raw_text": "Acme is hiring a remote Senior Backend Engineer to build APIs, async systems, and platform services.",
      "sharer_gg_id": "16180"
    }
  }
}
```

## 9. Job Fallback After Company Resolve Succeeded

Use this when the previous request produced a Torre organization id but the job resolve path failed.

```json
{
  "request_id": "fallback-job-20260424-0001",
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
            "id": "acme-labs",
            "name": "Acme Labs"
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
- When switching from `resolve_and_publish` to a direct fallback, always use a new `request_id`.
- If the company is already known in Torre, prefer `company.resolve_and_publish` with `company.input.torre_id`.
- If `job.resolve_and_publish` includes both `job_url` and manual content, keep both.
- If you need explicit sharer attribution:
  - use `job.input.sharer_gg_id` for `job.resolve_and_publish`
  - use `job.publish_payload.opportunity.sharers` for `job.direct_publish`
- If you need subtorre association, send `job.subtorre`.
- Do not send `https://news.ycombinator.com/jobs` or another listing index as the company website or canonical job URL.
- Wait at least `1000ms` between async status checks.
