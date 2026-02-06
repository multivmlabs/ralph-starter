#!/usr/bin/env node
/**
 * Updates CHANGELOG.md with a new release entry
 *
 * Usage: node update-changelog.js <title>
 * Environment variables:
 *   - NEW_VERSION: The new version number
 *   - TODAY: The release date (YYYY-MM-DD)
 *   - CHANGE_TYPE: The type of change (Added, Fixed, Changed)
 *   - SOURCE_PR: The PR number
 */

const fs = require('fs');
const path = require('path');

const version = process.env.NEW_VERSION;
const date = process.env.TODAY;
const changeType = process.env.CHANGE_TYPE;
const pr = process.env.SOURCE_PR;
const title = process.argv[2];

if (!version || !date || !changeType || !pr || !title) {
  console.error('Missing required environment variables or arguments');
  console.error('Required env: NEW_VERSION, TODAY, CHANGE_TYPE, SOURCE_PR');
  console.error('Required arg: title');
  process.exit(1);
}

const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
const entry = `## [${version}] - ${date}\n\n### ${changeType}\n- ${title} (#${pr})\n\n`;

let changelog = fs.readFileSync(changelogPath, 'utf8');
const lines = changelog.split('\n');

// Find insertion point dynamically
// First try to find a sentinel marker
let insertIdx = lines.findIndex(l => l.trim().startsWith('<!-- CHANGELOG_ENTRY -->'));

// If no marker, find the first version heading
if (insertIdx === -1) {
  insertIdx = lines.findIndex(l => l.trim().match(/^## \[\d/));
}

// If still not found, default to after header (line 6)
if (insertIdx === -1) {
  insertIdx = 6;
}

// Build the new changelog
const header = lines.slice(0, insertIdx).join('\n');
const rest = lines.slice(insertIdx).join('\n');

changelog = header + '\n\n' + entry + rest;
fs.writeFileSync(changelogPath, changelog);

console.log(`Updated CHANGELOG.md with entry for v${version}`);
