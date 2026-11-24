---
name: torre-find-matching-jobs
description: Use when a job seeker asks for jobs that fit them on Torre, wants remote job search, or wants to know why a job is or isn't a good match for their profile.
---

# Torre Find Matching Jobs

## Overview

Help a job seeker find Torre jobs that fit their professional Genome and preferences. Read-only and free. Applying happens on Torre.

## Workflow

### 1. Get matches

Call `listCandidateJobMatches`. Each item has a `job` and its `match`. For specific filters (remote only, Torre jobs only), call `searchJobs` with `onlyRemote` or `torreOnly`. Follow `pagination.next_cursor` for more.

### 2. Shortlist five to ten jobs

For each: title, company, remote or location, and one line on why it fits.

### 3. Explain the top matches

For jobs the user cares about, call `getJob` and `getCandidateJobMatch`. Translate `factors` into plain language, and list `requirements` the user does not pass (for example compensation or location).

### 4. Suggest improvements

If the same gap repeats across matches, suggest the profile update that would help most.

### 5. Next steps

Give the job links. Do not apply for the user.

## Rules

- Be honest about weak fits.
- Don't ask for or repeat personal data the user hasn't offered.
- Another person's public profile (`getPerson`) never gives access to their job matches.
