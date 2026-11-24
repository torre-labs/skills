---
name: torre-hiring-pipeline-report
description: Use when asked for a recruiting status update, hiring pipeline review, weekly hiring report or dashboard summary across a user's Torre openings.
---

# Torre Hiring Pipeline Report

## Overview

A short, read-only status report across the user's Torre openings. This skill never changes anything, so it is safe to run unattended.

## Workflow

### 1. List openings

Call `listOpenings` and follow `pagination.next_cursor`. Keep openings that are open: published, or drafts still being set up.

### 2. Per opening

Call `listApplicants` and count applicants by stage and status. Note the newest `appliedAt`, how many have no `reviewedAt`, and the longest time since `stageEnteredAt`. Use `listStages` to name stages.

### 3. Find what needs attention

- Openings not published, or with no applicants after a week
- Openings not aligned (`aligned` is null), so searches won't run
- Applicants waiting in one stage for more than 7 days
- Strong matches (high `matchScore`) nobody has reviewed

### 4. Write the report

1. One paragraph: open roles, new applicants this week, biggest risk.
2. A table, one row per opening: role, status, applicants, unreviewed, oldest waiting, next action.
3. "Do this week": at most five actions, each naming the opening.

### 5. Offer follow-ups

Source candidates for a thin opening (`torre-source-candidates`) or screen a backlog (`torre-screen-applicants`).

## Rules

- Read-only. Do not move, review or message anyone from this skill.
- Leave applicant contact details out of the report.
- Keep it to one screen. Link to openings instead of pasting descriptions.
