---
name: torre-publish-job
description: Use when someone pastes or links a job description, asks to post a job or create an opening on Torre, or needs to fix a job post that will not publish.
---

# Torre Publish Job

## Overview

Turn a job description into a complete Torre opening and publish it to Torre's job network after the user approves. Creating a draft is safe; publishing is a visible change and needs the user's go-ahead.

## When to Use

- "Here's our job description. Create the opening and publish it."
- "Why won't my job publish?"
- Before `torre-source-candidates` when no opening exists yet

For importing jobs found on external pages or boards, use the job publishing group (`using-torre-agent-skills`) instead.

## Workflow

### 1. Get the source and the company

Take the description the user pasted, or ask for it. Call `getAccount` to see the organizations the user can post for. If the company is not there, find it with `searchOrganizations` or `matchOrganization` and check its website, not only its name. Create one with `createOrganization` only after the user approves.

### 2. Create a draft

Call `createOpening` with the description as `sourceText` and the company's `organization_id`. Torre structures it into title, skills, languages, compensation, location and responsibilities. The result is an unpublished draft.

### 3. Review it with the user

Call `getOpening` and summarize what Torre extracted. Point out what looks wrong or vague: missing compensation, unclear location, too many must-have skills, skills without an experience level. Ask about missing information instead of guessing.

### 4. Apply edits once

Collect the corrections and send one `updateOpening`. Update a deadline in its own call. Check what was saved before adding screening questions with `addScreeningQuestion`.

### 5. Align, then publish on approval

Publishing normally requires an aligned opening. Offer to align it (see `torre-source-candidates`, step 3). When the user says to publish, call `publishOpening` with `published: true`. Skip alignment only if the user asks; that does not bypass completeness.

If the result is `opening_incomplete`, list `error.details.fields` in plain words, ask for them, update, and try once more. Do not resend the same publish request.

### 6. Report

Call `getOpening` to confirm `published: true`, then give the public job link. Applicants arrive in the opening; `torre-screen-applicants` reviews them.

## Rules

- Do not publish without the user's explicit go-ahead in this conversation.
- Do not invent compensation, benefits or requirements. Ask.
- Keep the company's voice; tidy the text, don't rewrite it.
- No age, gender or nationality requirements unless legally required for the role.
- If a create call fails or times out, check for a saved draft before creating another.
- Publishing does not activate paid sponsorship. Use `torre-sponsor-job` for that.
