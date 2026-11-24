---
name: torre-source-candidates
description: Use when a recruiter or hiring manager asks to find candidates, build a shortlist, or search talent for a role on Torre, with or without an existing opening.
---

# Torre Source Candidates

## Overview

Torre ranks people against an opening's criteria using each person's professional Genome. A search only runs on an aligned opening (criteria confirmed), so the quality of the shortlist depends on getting the criteria right first.

Searching is read-only and does not contact, invite or charge for anyone.

## When to Use

- "Find candidates for my Senior Data Engineer opening"
- "Build a shortlist of 10 people for this role"
- The user describes a role that has no opening yet (hand off to `torre-publish-job` first)

## Workflow

### 1. Find the opening

Call `listOpenings` and match the role the user named. If more than one could match, ask. If none exists, offer to create one with `torre-publish-job`, then continue here.

### 2. Check the criteria

Call `getOpening` and summarize in five lines or fewer: title, must-have skills with experience levels, languages, location or remote rules, and compensation. Ask the user to correct anything wrong. Changing criteria resets alignment, so collect every edit and apply it with one `updateOpening` call.

### 3. Align if needed

Call `getAlignment`. If `aligned` is null:

1. Call `presentAlignmentCandidate` and show the user the fictional sample candidate it returns.
2. If the user says it is not a match, send their reasons with `submitAlignmentFeedback`. That can update requirements and add screening questions, which are already saved; do not add them again. Present a new sample.
3. When the user agrees the sample is the kind of person they want, call `confirmPresentedAlignment`. If the opening changed since the sample was presented, present a new one first. `confirmAlignment` confirms the current criteria without a sample when the user explicitly prefers that.

### 4. Search

Call `createCandidateSearch` with the `openingId` and a `size` of 20 to 25 unless the user asked for a number. For more results, call `getCandidateSearch` with the returned `searchId` and pass `nextCursor` back unchanged, or `page` and `pageSize` when the search includes external candidates.

### 5. Shortlist

For the top results, read profiles you need with `getPerson`. Present a table: name, headline, two or three reasons they fit, and one gap or risk. Rank by the user's must-haves, not only Torre's order, and say when you reordered.

### 6. Next steps

Offer more pages, refined criteria, or, if the person has applied, `torre-message-applicants`.

## Rules

- Never message, invite or contact a candidate from this skill.
- Do not guess or look up contact details elsewhere.
- Do not judge candidates on protected characteristics or infer them from names or photos.
- If something costs credits (for example sponsoring the job), switch to `torre-sponsor-job`.
