---
name: using-torre-recruiting-skills
description: Use when someone wants to recruit or job-search with Torre through its MCP server (find candidates, post a job, screen applicants, message applicants, sponsor a job, report on hiring, or find matching jobs) and you need to check the connection and pick the right Torre recruiting skill.
---

# Using Torre Recruiting Skills

## Overview

Entry skill for the Torre recruiting group. These skills use the Torre MCP server at `https://torre.ai/mcp`, not the `crawl.torre.ai` API used by the job publishing group in this repository.

Check the connection first, then hand off to one skill.

## Connect

If no Torre tools are available, the user needs to connect Torre once. Point them to `https://torre.ai/mcp/connect`, which has a one-click link for Claude and setup for Claude Code, Codex and other clients. The user signs in with their normal Torre account and approves access in the browser. No API key or token is pasted into the chat.

To check that the connection works, call `listWebhookEndpoints` with no arguments. An HTTP 200 result, including an empty list, means the connection works. Do not create anything to test it.

If tools exist but return 401, ask the user to reconnect through their client's sign-in. Do not ask for credentials.

## Routing

| The user wants to | Use |
| --- | --- |
| Find or shortlist people for a role | `torre-source-candidates` |
| Create, fix or publish a job post | `torre-publish-job` |
| Review applicants, rule people out, move them between stages | `torre-screen-applicants` |
| Read or answer messages from applicants | `torre-message-applicants` |
| Reach more candidates by sponsoring a job | `torre-sponsor-job` |
| A status report across open jobs | `torre-hiring-pipeline-report` |
| Jobs that fit them as a job seeker | `torre-find-matching-jobs` |
| Import jobs from external pages or boards | `using-torre-agent-skills` (job publishing group) |

If the request covers several of these, start with the earliest step in the hiring flow: publish, then source, then screen, then message.

## Rules for every Torre recruiting skill

- Connecting is not approval. Publishing, messaging, moving or ruling out applicants, and anything that spends credits need the user's explicit go-ahead in the conversation, for that specific action.
- Never retry a write automatically after a timeout or unclear result. Read the record again first; the write may already be saved.
- Read `isError` and `status` in each tool result before treating it as success.
- Search results are contact-free public profiles. Do not look up contact details elsewhere.
- Never use or infer protected characteristics (age, gender, ethnicity, religion, disability, nationality and similar) when judging people.
- Keep credentials and private application URLs out of messages, reports and logs.
