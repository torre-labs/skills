# Torre.ai Skills

Welcome to the Torre.ai skills repository.

This project is home to a growing set of Agent Skills for working with Torre.ai. Each skill is a small, focused guide that helps an AI agent complete a specific workflow with the right context, steps, and operating rules.

## What You Will Find Here

This repository is organized into skill groups.

Each group is designed around a workflow area in Torre.ai. The first group available here is focused on publishing jobs. More groups are coming soon.

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

## Repository Layout

```text
skills/
├── using-torre-agent-skills/
├── torre-select-external-jobs/
├── torre-resolve-external-job-context/
├── torre-post-external-jobs/
└── torre-operate-external-job-batches/
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

## API Access

Some Torre.ai workflows require API access.

Use this base URL by default:

```text
https://crawl.torre.ai/api
```

To request an API token, write to [juanfer@torre.ai](mailto:juanfer@torre.ai).

## Coming Next

This repository will keep growing with more Torre.ai skill groups.

For now, the publishing group is the first one available. More workflows are coming soon.
