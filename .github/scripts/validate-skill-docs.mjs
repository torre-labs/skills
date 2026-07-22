#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repositoryRoot = process.cwd();
const skillsRoot = path.join(repositoryRoot, 'skills');
const spiderContract = {
  repository: 'torre-labs/spider-v2',
  commit: 'f60b24be2242f4b0468ceefb457a3bbde6ec991d',
  requestSpec: 'spec/03-crawling/004-skill-crawl-endpoint/004-spec.md',
  directValidator: 'src/posting/job-pipeline.service.ts',
};
const errors = [];
const markdownFiles = [];
let jsonBlocks = 0;
let relativeLinks = 0;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(entryPath);
    } else if (entryPath.endsWith('.md')) {
      markdownFiles.push(entryPath);
    }
  }
}

function relativePath(filePath) {
  return path.relative(repositoryRoot, filePath).split(path.sep).join('/');
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function report(filePath, source, index, message) {
  errors.push(`${relativePath(filePath)}:${lineNumber(source, index)} ${message}`);
}

function validateSpiderJobExample(filePath, source, index, parsed) {
  const job = parsed?.job;
  if (!job || job.strategy !== 'direct_publish') {
    return;
  }

  const fail = (message) => report(filePath, source, index, message);
  const payload = job.publish_payload;
  const opportunity = payload?.opportunity;
  const requiredArrays = [
    'strengths',
    'organizations',
    'languages',
    'details',
    'attachments',
    'members',
    'sharers',
    'timezones',
  ];

  if (!Number.isInteger(payload?.subjectId) || payload.subjectId <= 0) {
    fail('direct-publish example requires a positive integer subjectId');
  }
  if (!opportunity || typeof opportunity !== 'object') {
    fail('direct-publish example requires an opportunity object');
    return;
  }
  if (
    !['employee', 'flexible-job', 'intern', 'part-time'].includes(
      opportunity.opportunity,
    )
  ) {
    fail('direct-publish example uses an unsupported opportunity type');
  }
  if (
    typeof opportunity.objective !== 'string' ||
    opportunity.objective.length === 0 ||
    opportunity.objective.length > 120
  ) {
    fail('direct-publish objective must contain 1-120 characters');
  }
  for (const field of ['intent', 'locale', 'externalApplicationUrl']) {
    if (typeof opportunity[field] !== 'string' || opportunity[field].length === 0) {
      fail(`direct-publish example requires non-empty opportunity.${field}`);
    }
  }
  if (opportunity.intent !== 'post-job' || opportunity.published !== true) {
    fail('direct-publish example must use intent post-job and published true');
  }
  for (const field of requiredArrays) {
    if (!Array.isArray(opportunity[field])) {
      fail(`direct-publish example requires opportunity.${field} as an array`);
    }
  }

  for (const member of opportunity.members ?? []) {
    if (typeof member?.ggId !== 'string' || member.ggId.length === 0) {
      fail('direct-publish member requires a non-empty ggId');
    }
    if (!['pending', 'accepted'].includes(member?.status)) {
      fail('direct-publish member status must be pending or accepted');
    }
    for (const flag of ['manager', 'poster', 'member', 'visible']) {
      if (typeof member?.[flag] !== 'boolean') {
        fail(`direct-publish member requires boolean ${flag}`);
      }
    }
    if (typeof member?.position !== 'number') {
      fail('direct-publish member requires numeric position');
    }
  }

  const place = opportunity.place;
  if (!place || typeof place !== 'object' || !Array.isArray(place.location)) {
    fail('direct-publish example requires a place with a location array');
    return;
  }
  const placeShape = {
    remote_anywhere: [true, true, false, false],
    remote_timezones: [true, false, true, false],
    remote_countries: [true, false, false, true],
    hybrid: [true, false, false, true],
    physical_location: [false, false, false, true],
  }[place.locationType];
  if (!placeShape) {
    fail('direct-publish example uses an unsupported place.locationType');
    return;
  }
  const [remote, anywhere, timezone, requiresLocation] = placeShape;
  if (
    place.remote !== remote ||
    place.anywhere !== anywhere ||
    place.timezone !== timezone ||
    (requiresLocation && place.location.length === 0) ||
    (!requiresLocation && place.location.length > 0)
  ) {
    fail('direct-publish example uses an inconsistent Spider place combination');
  }
  if (
    place.locationType === 'remote_timezones' &&
    opportunity.timezones?.length !== 2
  ) {
    fail('remote_timezones example requires exactly two timezone offsets');
  }
  if (
    place.locationType !== 'remote_timezones' &&
    opportunity.timezones?.length !== 0
  ) {
    fail('non-timezone place examples require an empty timezones array');
  }
}

function validateJsonBlocks(filePath, source) {
  for (const match of source.matchAll(/```json\s*\n([\s\S]*?)```/g)) {
    jsonBlocks += 1;
    const block = match[1];
    let parsed;
    try {
      parsed = JSON.parse(block);
      validateSpiderJobExample(filePath, source, match.index, parsed);
    } catch (error) {
      report(filePath, source, match.index, `invalid JSON example: ${error.message}`);
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      'request_id' in parsed &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
        parsed.request_id,
      )
    ) {
      report(
        filePath,
        source,
        match.index,
        'request_id examples must use the UUID v4 shape required by Spider',
      );
    }

    const fixedDeadlineIndex = block.search(/"type"\s*:\s*"specific-date"/);
    if (fixedDeadlineIndex >= 0) {
      report(
        filePath,
        source,
        match.index + fixedDeadlineIndex,
        'reusable JSON examples must not use an expiring specific-date deadline; use type "never" and explain source-provided future dates in prose',
      );
    }
  }
}

function validateRelativeLinks(filePath, source) {
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^(https?:|mailto:|#)/.test(target)) {
      continue;
    }

    relativeLinks += 1;
    if (!fs.existsSync(path.resolve(path.dirname(filePath), target))) {
      report(filePath, source, match.index, `broken relative link: ${match[1]}`);
    }
  }
}

function requireText(filePath, source, text, message) {
  if (!source.includes(text)) {
    report(filePath, source, 0, message);
  }
}

function forbidPattern(filePath, source, pattern, message) {
  const match = pattern.exec(source);
  if (match) {
    report(filePath, source, match.index, message);
  }
}

walk(skillsRoot);

for (const filePath of markdownFiles) {
  const source = fs.readFileSync(filePath, 'utf8');
  validateJsonBlocks(filePath, source);
  validateRelativeLinks(filePath, source);
}

const fieldRestrictionsPath = path.join(
  skillsRoot,
  'torre-post-external-jobs/references/field-restrictions.md',
);
const fieldRestrictions = fs.readFileSync(fieldRestrictionsPath, 'utf8');
requireText(
  fieldRestrictionsPath,
  fieldRestrictions,
  'When a fetchable `job_url` is present, Spider fetches that URL first.',
  'source precedence must state that a fetchable job_url is primary',
);
requireText(
  fieldRestrictionsPath,
  fieldRestrictions,
  '`raw_html` and `raw_text` are fallback sources only when URL acquisition fails or when no fetchable `job_url` is present.',
  'source precedence must restrict manual content to Spider-compatible fallback cases',
);
requireText(
  fieldRestrictionsPath,
  fieldRestrictions,
  '`external_application_url`',
  'job input contract must document Spider external_application_url support',
);
requireText(
  fieldRestrictionsPath,
  fieldRestrictions,
  '`redirect_missing_location`, `redirect_invalid_location`,',
  'redirect guidance must use Spider redirect diagnostics',
);
forbidPattern(
  fieldRestrictionsPath,
  fieldRestrictions,
  /redirect_not_acceptable[^\n]*(?:manual click|login|search|form)/iu,
  'manual-interaction wrappers must not be presented as Spider redirect failures',
);

const placeWorkaroundPath = path.join(
  skillsRoot,
  'torre-post-external-jobs/references/place-validation-workaround.md',
);
if (fs.existsSync(placeWorkaroundPath)) {
  const placeWorkaround = fs.readFileSync(placeWorkaroundPath, 'utf8');
  requireText(
    placeWorkaroundPath,
    placeWorkaround,
    'Do not remove location evidence',
    'place remediation must preserve candidate-critical location evidence',
  );
  requireText(
    placeWorkaroundPath,
    placeWorkaround,
    'Verify the published opportunity',
    'place remediation must require post-publication fidelity verification',
  );
  forbidPattern(
    placeWorkaroundPath,
    placeWorkaround,
    /location-identifying lines stripped|clean location clues out of|drop lines that are only/iu,
    'place remediation must not recommend stripping source location evidence',
  );
}

const companyWorkaroundPath = path.join(
  skillsRoot,
  'torre-post-external-jobs/references/company-enrichment-timeout-workaround.md',
);
if (fs.existsSync(companyWorkaroundPath)) {
  const companyWorkaround = fs.readFileSync(companyWorkaroundPath, 'utf8');
  requireText(
    companyWorkaroundPath,
    companyWorkaround,
    'explicit operator confirmation before every name-only `company.direct_publish`',
    'name-only direct company publication must require explicit approval every time',
  );
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }
  console.error(`Validation failed with ${errors.length} problem(s).`);
  process.exit(1);
}

console.log(
  `Validated ${markdownFiles.length} Markdown files, ${jsonBlocks} JSON blocks, and ${relativeLinks} relative links against Spider ${spiderContract.commit.slice(0, 8)}.`,
);
