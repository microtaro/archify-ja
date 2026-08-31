#!/usr/bin/env node
// The Japanese edition still has suites whose expectations were written against
// the English product. Until they are rewritten, `npm test` is permanently red,
// which hides any *new* breakage in the noise. This runs the suite, compares the
// failing test names against a recorded baseline, and only fails on a difference:
//
//   node scripts/known-failures.mjs           check against the baseline
//   node scripts/known-failures.mjs --update  record the current failures
//
// A test that starts failing is reported. A test that starts passing is reported
// too, so the baseline shrinks deliberately instead of drifting.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillRoot = path.join(repoRoot, 'archify');
const baselinePath = path.join(repoRoot, 'docs', 'known-test-failures.json');
const update = process.argv.includes('--update');

const testFiles = fs.readdirSync(path.join(skillRoot, 'test'))
  .filter((entry) => entry.endsWith('.test.mjs'))
  .sort()
  .map((entry) => path.join('test', entry));

const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...testFiles], {
  cwd: skillRoot,
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
});
if (result.error) throw result.error;

// TAP marks a failure as "not ok <n> - <name>". Subtests are indented; the
// top-level lines are the ones that map to a test() call.
const failing = new Set();
for (const line of (result.stdout || '').split('\n')) {
  const match = /^not ok \d+ - (.+?)(?: # .*)?$/.exec(line);
  if (match) failing.add(match[1].trim());
}

const sorted = [...failing].sort();

if (update) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify({
    recorded: new Date().toISOString().slice(0, 10),
    note: 'Suites still asserting the English product. Shrink this list; never grow it.',
    failures: sorted,
  }, null, 2)}\n`);
  process.stdout.write(`recorded ${sorted.length} known failures -> ${path.relative(repoRoot, baselinePath)}\n`);
  process.exit(0);
}

if (!fs.existsSync(baselinePath)) {
  process.stderr.write('no baseline: run `node scripts/known-failures.mjs --update` first\n');
  process.exit(1);
}

const baseline = new Set(JSON.parse(fs.readFileSync(baselinePath, 'utf8')).failures);
const regressions = sorted.filter((name) => !baseline.has(name));
const fixed = [...baseline].filter((name) => !failing.has(name)).sort();

if (fixed.length) {
  process.stdout.write(`${fixed.length} known failure(s) now pass — remove them from the baseline:\n`);
  for (const name of fixed) process.stdout.write(`  + ${name}\n`);
}
if (regressions.length) {
  process.stderr.write(`\n${regressions.length} NEW failure(s):\n`);
  for (const name of regressions) process.stderr.write(`  ✗ ${name}\n`);
  process.stderr.write('\nFix them, or record them deliberately with --update.\n');
  process.exit(1);
}

process.stdout.write(`no new failures (${failing.size} known, ${baseline.size} recorded)\n`);
process.exit(fixed.length ? 1 : 0);
