---
name: torre-resolve-external-job-context
description: Use when a selected external job still needs company identifiers, a canonical job URL, or trustworthy source fields before you can build a Torre ingest request.
---

# Torre Resolve External Job Context

## Overview

Use this skill after job selection and before payload construction.

Its goal is to turn a selected role into trustworthy company and job inputs. Do not invent identifiers. Do not reuse aggregator URLs as canonical company or job fields.

## Workflow

### 1. Resolve company identity

Prefer these signals in order:

1. `torre_id`
2. company website
3. company domain
4. LinkedIn company URL
5. company name

`careers_url` is supporting context, not the primary company identity.

### 2. Resolve the canonical job URL

- Use the most specific stable role page you can verify.
- Third-party board indexes are not canonical job URLs.
- If the selected source is a YC or HN listing, drill into the company or role page first and extract the actual company website or the real role page.
- If no trustworthy job URL exists but the job content is trustworthy, keep `raw_text` or `raw_html` and omit `job_url`.
- If the operator or source explicitly says the resulting opportunity is non-crawled, carry `crawled: false` into `job.input`; otherwise omit `crawled` so the ingest API defaults it to `true`.

### 3. Preserve trustworthy job content

- Use `raw_html` when you can capture the canonical job page, especially when it includes structured job data such as JSON-LD.
- Use `raw_text` only when it is the full role content or the best trustworthy source available.
- Do not replace a readable canonical job page with a short summary, listing-card snippet, or rewritten text that omits role-critical evidence.
- Before sending manual content, check that explicit compensation, location, commitment, requirements, and application instructions from the source are preserved when they exist.
- If the only available text is incomplete but `job_url` is readable, omit `raw_text` so the ingest API can extract from `job_url`.

### 4. Pick the usable request shape

- Company-only request when only the company is trustworthy or the user only wants the company published
- `job.resolve_and_publish` when the job still needs extraction or assembly
- `job.direct_publish` only when the job payload is already Torre-ready

### 5. Preserve provenance cleanly

- Keep board or aggregator URLs in metadata or as source evidence
- Keep the canonical company and job fields separate from discovery URLs

## Quick Reference

| Field | Preferred source |
| --- | --- |
| `company.input.website_url` | Company website |
| `company.input.domain` | Company hostname |
| `company.input.linkedin` | LinkedIn company URL |
| `company.input.careers_url` | Company or ATS careers surface |
| `job.input.job_url` | Canonical role page |
| `job.input.raw_html` | Trusted canonical page capture, including structured data when available |
| `job.input.raw_text` | Full trusted role content when URL is weak or HTML is unavailable |
| `job.input.crawled` | Optional boolean provenance flag; omit for API default `true` |

## Common Mistakes

- Using `https://news.ycombinator.com/jobs` as a company or job URL
- Using a YC directory page as the company website when the page exposes the real company website separately
- Sending a board homepage as `job_url`
- Sending a short `raw_text` summary that overrides a richer readable `job_url`
- Dropping JSON-LD or other structured job data from a captured page
- Inventing `domain`, `linkedin`, or `torre_id`
- Omitting the company-only path when the job is not trustworthy enough yet
