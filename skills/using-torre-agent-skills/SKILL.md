---
name: using-torre-agent-skills
description: Use when work involves finding, selecting, resolving, or publishing external jobs to Torre and you need to decide which Torre job skill should handle the next step.
---

# Using Torre Agent Skills

## Overview

Use this as the entry skill for the Torre job skill suite.

Do not start by guessing which specialized skill to load. First classify the shape of the work, then hand off to the right skill.

## When to Use

- The user wants help publishing external jobs to Torre
- The source may be a listing page, company jobs page, browser flow, or direct job link
- It is not yet clear whether the work is a small request or a long-running batch
- It is not yet clear whether discovery, resolution, or publication is the next step

## Routing Rules

### 1. Decide whether this is single-run or batch-run work

- If the work covers only a few jobs, stay on the single-run path.
- If the work may involve dozens, hundreds, or thousands of jobs, route to `torre-operate-external-job-batches`.
- If the source depends on browser interaction and the run is likely to be long, route to `torre-operate-external-job-batches`.

### 2. Decide whether selection is already done

- If the source contains multiple candidate jobs and the publish set is not explicit, route to `torre-select-external-jobs`.
- If the user already approved the exact jobs, skip selection.

### 3. Decide whether context resolution is still missing

- If company identity is weak or ambiguous, route to `torre-resolve-external-job-context`.
- If the canonical job URL is still unclear, route to `torre-resolve-external-job-context`.
- If the work may be `company-only`, route to `torre-resolve-external-job-context` before publishing.

### 4. Route to publication only when the request is ready

- If the publish set is defined and the company/job context is trustworthy, route to `torre-post-external-jobs`.
- `torre-post-external-jobs` decides:
  - `company-only`
  - `resolve_and_publish`
  - `direct_publish`

## Quick Reference

| Situation | Use |
| --- | --- |
| Unsure where to start in the Torre suite | `using-torre-agent-skills` |
| Listing page or search results with many jobs | `torre-select-external-jobs` |
| Company or job URL is still ambiguous | `torre-resolve-external-job-context` |
| A few jobs are ready to publish | `torre-post-external-jobs` |
| The run is large or long-running | `torre-operate-external-job-batches` |

## Common Mistakes

- Jumping straight to publish before selection is complete
- Publishing before resolving canonical company or job inputs
- Treating a large run like a one-off request
- Using this entry skill as if it were the publishing skill itself
