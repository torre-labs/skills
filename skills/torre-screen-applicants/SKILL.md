---
name: torre-screen-applicants
description: Use when a recruiter asks to review, screen, triage or shortlist applicants for a Torre opening, record match or ruled-out decisions, or move applicants between hiring stages.
---

# Torre Screen Applicants

## Overview

Torre ranks applicants by match. This skill applies the recruiter's own must-haves on top, prepares decisions as a table, and writes only what the user approves.

## When to Use

- "Screen applicants for my Product Designer role. Must-haves: Figma, B2B SaaS."
- "Move the top 3 to interview."
- "Clean up my pipeline."

## Workflow

### 1. Pick the opening

Call `listOpenings` if the user didn't give one.

### 2. Ask for the bar

Ask for up to five must-haves and any deal-breakers. If the user doesn't want to set any, use the opening's own criteria from `getOpening`.

### 3. List applicants

Call `listApplicants` with `sort: match_rank` and `limit: 25`, following `pagination.next_cursor` page by page. Read one applicant in detail with `getApplicant` when needed.

### 4. Assess

For each applicant decide advance, hold or rule out, with a one-line reason that cites evidence from their profile. Flag thin evidence as hold instead of ruling someone out.

### 5. Show the decision table before changing anything

Columns: name, match score, decision, reason. Group by decision. Wait for approval of the table or of specific rows.

### 6. Apply only what was approved

- Moves: call `listStages` for stage IDs, then `updateApplicant` with `stageId`. Use IDs, not stage names.
- Rule-outs: call `reviewApplicant` with `verdict: ruled_out`, a `reason`, and short, respectful `feedback`. Leave `notifyApplicant` off unless the user asks to notify.
- Matches: `reviewApplicant` with `verdict: match`.

### 7. Summarize

Say what changed and what is left to review.

## Rules

- Nothing is written until the user approves.
- A review can be saved even if the call errors. Read the applicant again before retrying.
- Base decisions only on job-relevant evidence. Never use or infer protected characteristics.
- Feedback is specific, kind and short. No internal notes in feedback.
- Use applicant contact details only for this opening, and leave them out of summaries.
