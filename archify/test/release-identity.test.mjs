import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const checker = path.join(repoRoot, 'scripts', 'check-release-identity.mjs');

function runCheck(root) {
  return spawnSync(process.execPath, [checker, '--root', root], { encoding: 'utf8' });
}

function write(root, relative, source) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
}

function japaneseFixture(overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-ja-release-identity-'));
  const release = {
    schemaVersion: 1,
    skillId: 'archify-ja',
    channel: 'development',
    version: '2.16.0-ja.1',
    source: { repository: 'https://github.com/microtaro/archify-ja' },
  };
  const files = {
    'archify/package.json': JSON.stringify({ name: 'archify-ja', version: '2.16.0-ja.1' }),
    'archify/package-lock.json': JSON.stringify({
      name: 'archify-ja',
      version: '2.16.0-ja.1',
      packages: { '': { name: 'archify-ja', version: '2.16.0-ja.1' } },
    }),
    'archify/SKILL.md': '---\nmetadata:\n  version: "2.16"\n  author: microtaro\n---\n\n# Archify-ja\n',
    'archify/skill-release.json': JSON.stringify(release),
    'archify/assets/template.html': '<meta name="generator" content="archify-ja 2.16.0-ja.1">',
  };
  for (const [relative, source] of Object.entries({ ...files, ...overrides })) write(root, relative, source);
  return root;
}

test('the checked-in Japanese edition has one exact offline release identity', () => {
  const result = runCheck(repoRoot);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), 'release identity ok: archify-ja 2.16.0-ja.1');
});

test('README mirrors do not present upstream hosted pages as Japanese edition product links', () => {
  const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  const mirror = fs.readFileSync(path.join(repoRoot, 'README_EN.md'), 'utf8');

  assert.equal(mirror, readme, 'README_EN.md must mirror README.md exactly');
  assert.doesNotMatch(readme, /https:\/\/tt-a1i\.github\.io\/archify/);
  assert.doesNotMatch(readme, /https:\/\/microtaro\.github\.io\/archify-ja/);
});

test('release identity rejects an injected update manifest', () => {
  const root = japaneseFixture({
    'archify/skill-release.json': JSON.stringify({
      schemaVersion: 1,
      skillId: 'archify-ja',
      channel: 'development',
      version: '2.16.0-ja.1',
      source: { repository: 'https://github.com/microtaro/archify-ja' },
      updateManifestUrl: 'https://example.invalid/manifest.json',
    }),
  });
  try {
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /without an update manifest/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('release identity rejects a generator that claims the upstream product', () => {
  const root = japaneseFixture({
    'archify/assets/template.html': '<meta name="generator" content="archify 2.16.0">',
  });
  try {
    const result = runCheck(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /generator must be archify-ja 2\.16\.0-ja\.1/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
