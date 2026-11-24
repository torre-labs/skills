---
name: torre-sponsor-job
description: Use when a recruiter wants more candidates for a Torre opening by sponsoring it, asks what boosting or promoting a job would cost, or wants to change or stop an active sponsorship.
---

# Torre Sponsor Job

## Overview

Torre Reach sponsors an opening on Torre (`torre-reach-internal`). Torre ReachMax distributes it beyond Torre (`torre-reach-external`). Both spend credits. Quotes are read-only and free; activation needs the user's explicit approval of the quoted amount.

## When to Use

- "How much would it cost to boost this opening for a week?"
- "Sponsor my job, budget 200 dollars."
- "Stop the sponsorship on the Designer role."

## Workflow

### 1. Check the opening and options

Call `getOpening` and confirm it is published, or will be. Call `listAttractionOptions` to see which services are available for this account.

### 2. Quote

Call `getReachQuote` with the explicit `services` the user chose. A quote does not publish, reserve funds or activate anything. Requote if the selection changes. Call `getBalance` to show whether the account has enough credits.

### 3. Ask for approval

Show the services, duration, the quoted amount and the current balance. Ask for a clear yes to that amount. If the balance is short, the user can top up on Torre; only create a checkout with `createTopUp` if they ask, and never complete a payment for them.

### 4. Activate

Call `activateReach` only after the yes, with exactly the quoted services. Then read the campaign with `getReach` and report its status.

### 5. Change or stop

To stop, call `stopReach` after the user confirms. Read `getReach` again to confirm it stopped and will not renew.

## Rules

- No activation, top-up or renewal without the user's explicit approval of the amount in this conversation.
- Never retry `activateReach` after an unclear result. Read `getReach` first.
- Don't describe prices from memory; use the quote and `getPricing`.
