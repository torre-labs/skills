#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repositoryRoot = process.cwd();
const skillsRoot = path.join(repositoryRoot, 'skills');
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

function validateJsonBlocks(filePath, source) {
  for (const match of source.matchAll(/```json\s*\n([\s\S]*?)```/g)) {
    jsonBlocks += 1;
    const block = match[1];
    try {
      JSON.parse(block);
    } catch (error) {
      report(filePath, source, match.index, `invalid JSON example: ${error.message}`);
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
  `Validated ${markdownFiles.length} Markdown files, ${jsonBlocks} JSON blocks, and ${relativeLinks} relative links.`,
);
