---
name: torre-select-external-jobs
description: Use when a user provides a listing page, search results, or selection criteria containing multiple possible jobs and you must decide which jobs should be prepared for Torre publication.
---

# Torre Select External Jobs

## Overview

Use this skill for discovery and selection only.

Do not publish during this phase. First reduce the source down to a confirmed set of jobs that the user actually wants.

## When to Use

- The source page contains multiple jobs
- The user provides filters instead of explicit job links
- The user says "publish jobs from this page"
- The source is an aggregator such as Hacker News Jobs, YC Jobs, or another board index

## Workflow

### 1. Classify the source

- Single role page: no shortlist needed
- Company jobs page: shortlist the relevant roles
- Aggregator page: shortlist first, then resolve each selected candidate

### 2. Extract candidates without overcommitting

Capture, at minimum:

- job title
- company name
- source URL for that row
- whether the row already points to a likely canonical role page

### 3. Lock the publish set

- If the user already approved specific jobs, keep only those.
- If the user gave filters, apply them and show the resulting shortlist.
- If the user gave only a page, ask which candidates should move forward instead of assuming all of them should be published.

### 4. Hand off only confirmed jobs

For each confirmed candidate, pass forward:

- selected title
- selected company
- source page URL
- source row URL
- any missing fields that still require resolution

If the confirmed set is large or the source spans many pages, switch into `torre-operate-external-job-batches` before continuing.

Then use `torre-resolve-external-job-context`.

## Quick Reference

| Situation | Action |
| --- | --- |
| Page contains many jobs | Build shortlist first |
| User gave filters | Apply filters, then confirm results |
| User said "publish these 3" | Keep only those 3 |
| Company jobs page mixes departments | Exclude roles outside the requested scope |

## Common Mistakes

- Treating every row from a listing page as approved for publication
- Resolving company details before confirming which jobs matter
- Losing the original source row URL needed for later resolution
