---
name: torre-message-applicants
description: Use when a recruiter wants to read applicant conversations on Torre, catch up on replies, draft answers, or send a message to an applicant about a specific opening.
---

# Torre Message Applicants

## Overview

Read applicant conversations and send messages through Torre, always with the user's approval of the exact text. Messages reach real people, so every send is confirmed one by one.

## When to Use

- "Did anyone reply about the Data Engineer role?"
- "Draft replies to the applicants who wrote this week."
- "Tell the top 3 applicants we'd like to schedule an interview."

## Workflow

### 1. Choose the conversation scope

A conversation is selected by exactly one of `openingId` (messages about that job) or `conversationId` (an exact thread, for example from a `message.replied` webhook). Never send both.

### 2. Read

Call `listConversationMessages` with the candidate and one selector. Follow `pagination.next_cursor` until null, keeping the same candidate and selector. Reading does not mark messages as read.

### 3. Draft

Write replies in the recruiter's voice: short, specific to the job, and clear about the next step. Show every draft with the recipient's name and the opening.

### 4. Send on approval

For each approved draft, call `messageCandidate` with the approved text and the same single selector. Do not edit approved text before sending.

If the result is unclear or times out, do not resend. Read the conversation again to check whether the message went out.

### 5. Read state

If the user asks, mark a conversation read or unread with `updateConversationReadStatus`.

## Rules

- Never send a message the user hasn't approved word for word.
- Applicant permissions apply: only message people who applied to an opening the user manages.
- No internal notes, scores or rule-out reasons in messages unless the user wrote them.
- Do not paste contact details into the chat.
