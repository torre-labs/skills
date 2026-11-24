# Torre.ai Skills

Welcome to the Torre.ai skills repository.

This project is home to a growing set of Agent Skills for working with Torre.ai. Each skill is a small, focused guide that helps an AI agent complete a specific workflow with the right context, steps, and operating rules.

## What You Will Find Here

This repository is organized into skill groups.

Each group is designed around a workflow area in Torre.ai. Two groups are available: **Job Publishing**, for importing external jobs, and **Recruiting**, for hiring and job search through Torre's MCP server.

Stay tuned, because there is more on the way.

## Current Skill Group: Job Publishing

The job publishing skills help agents work with external job sources and prepare them for publication in Torre.ai.

They can help with:

- selecting the right jobs from a list or search result
- resolving company and job context before publishing
- publishing one or a few external jobs
- operating larger publishing batches with progress tracking and reports

The current group includes:

| Skill | What it does |
| --- | --- |
| `using-torre-agent-skills` | Entry point for choosing the right Torre.ai skill for the next step. |
| `torre-select-external-jobs` | Helps choose which jobs should be prepared when a source contains multiple possible matches. |
| `torre-resolve-external-job-context` | Helps resolve company identity, canonical company URLs, and canonical job URLs before publishing. |
| `torre-post-external-jobs` | Helps publish one or more external jobs once the job and company context are ready. |
| `torre-operate-external-job-batches` | Helps run larger publishing batches with durable tracking, reporting, and resumable progress. |

## Skill Group: Recruiting

The recruiting skills let an AI agent hire and job-search on Torre through the Torre MCP server: align a job and find candidates, publish openings, screen and message applicants, sponsor a job, report on the pipeline, and find matching jobs. Every skill asks before it publishes, messages, moves an applicant or spends credits.

| Skill | What it does | Try saying |
| --- | --- | --- |
| `using-torre-recruiting-skills` | Checks the Torre connection and picks the right recruiting skill. | "Help me hire with Torre." |
| `torre-source-candidates` | Confirms a job's criteria, aligns it and shortlists matching candidates with evidence. | "Find candidates for my Senior Data Engineer opening and shortlist the best 5." |
| `torre-publish-job` | Turns a job description into a complete opening and publishes it after approval. | "Here's our job description. Create the opening, tell me what's missing, and publish it." |
| `torre-screen-applicants` | Screens applicants against your must-haves and records approved decisions and stage moves. | "Screen applicants for my Product Designer role. Must-haves: Figma, B2B SaaS." |
| `torre-message-applicants` | Reads applicant conversations and sends replies you approve. | "Did anyone reply about the Data Engineer role? Draft answers." |
| `torre-sponsor-job` | Quotes Torre Reach sponsorship and activates it only after you approve the amount. | "How much would it cost to boost this opening for a week?" |
| `torre-hiring-pipeline-report` | A read-only weekly report across your open jobs. | "Give me this week's hiring pipeline report." |
| `torre-find-matching-jobs` | Jobs that fit a job seeker's profile, with match reasons. | "Find remote jobs that fit my profile and explain why the top one matches." |

### Connect Torre first

The recruiting skills need the Torre MCP server connected to your agent. Follow [torre.ai/mcp/connect](https://torre.ai/mcp/connect?utm_source=github&utm_medium=repo&utm_campaign=api-mcp-launch&utm_content=skills), or send your agent:

    Connect me to Torre using https://torre.ai/mcp/connect

You sign in with your Torre account and approve access in the browser. No API key is needed. Server URL: `https://torre.ai/mcp`.

## Repository Layout

```text
skills/
├── using-torre-agent-skills/
├── torre-select-external-jobs/
├── torre-resolve-external-job-context/
├── torre-post-external-jobs/
├── torre-operate-external-job-batches/
├── using-torre-recruiting-skills/
├── torre-source-candidates/
├── torre-publish-job/
├── torre-screen-applicants/
├── torre-message-applicants/
├── torre-sponsor-job/
├── torre-hiring-pipeline-report/
└── torre-find-matching-jobs/
```

Each skill folder includes a `SKILL.md` file with the instructions an agent should follow.

## Installation

Install the Torre.ai skills package with:

```bash
npx skills add torre-labs/skills
```

After installing, start with the entrypoint skill. Use the invocation style for
your agent:

```text
Codex/OpenAI: $using-torre-agent-skills
Claude: /using-torre-agent-skills
```

For recruiting, start with `$using-torre-recruiting-skills` (Codex/OpenAI) or
`/using-torre-recruiting-skills` (Claude).

## API Access for Job Publishing

The job publishing skills use the crawl API below. The recruiting skills use the Torre MCP server instead and need no token.

Some Torre.ai workflows require API access.

Use this base URL by default:

```text
https://crawl.torre.ai/api
```

To request an API token, write to [juanfer@torre.ai](mailto:juanfer@torre.ai).

## Coming Next

This repository will keep growing with more Torre.ai skill groups.

For now, the publishing group is the first one available. More workflows are coming soon.
