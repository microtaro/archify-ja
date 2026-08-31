import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkForUpdate } from '../scripts/check-update.mjs';
import {
  DEFAULT_MANIFEST_URL,
  EXPECTED_REPOSITORY,
  SKILL_ID,
  validateLocalRelease,
} from '../scripts/update-contract.mjs';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function offlineRelease(overrides = {}) {
  return {
    schemaVersion: 1,
    skillId: 'archify-ja',
    channel: 'development',
    version: '2.16.0-ja.1',
    source: { repository: 'https://github.com/microtaro/archify-ja' },
    ...overrides,
  };
}

function writeRelease(value) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-ja-offline-update-'));
  const releasePath = path.join(root, 'skill-release.json');
  fs.writeFileSync(releasePath, `${JSON.stringify(value)}\n`);
  return { root, releasePath };
}

test('the packaged update contract has one exact offline Japanese identity', () => {
  assert.equal(SKILL_ID, 'archify-ja');
  assert.equal(EXPECTED_REPOSITORY, 'https://github.com/microtaro/archify-ja');
  assert.equal(DEFAULT_MANIFEST_URL, null);
  assert.deepEqual(validateLocalRelease(offlineRelease()), offlineRelease());

  const checkedIn = JSON.parse(fs.readFileSync(path.join(skillRoot, 'skill-release.json'), 'utf8'));
  assert.deepEqual(checkedIn, offlineRelease());
});

test('a valid offline Japanese release disables before fetch and cache work', async (t) => {
  const fixture = writeRelease(offlineRelease());
  t.after(() => fs.rmSync(fixture.root, { recursive: true, force: true }));
  let requests = 0;

  const result = await checkForUpdate({
    releasePath: fixture.releasePath,
    cacheDirectory: path.join(fixture.root, 'cache'),
    fetchImpl: async () => {
      requests += 1;
      throw new Error('offline edition must not fetch');
    },
  });

  assert.deepEqual(result, { status: 'silent', reason: 'disabled' });
  assert.equal(requests, 0);
  assert.equal(fs.existsSync(path.join(fixture.root, 'cache')), false);
});

test('invalid Japanese release metadata is rejected without a request', async (t) => {
  const invalidReleases = [
    offlineRelease({ schemaVersion: 2 }),
    offlineRelease({ channel: 'stable' }),
    offlineRelease({ version: '2.16.0-ja.2' }),
    offlineRelease({ source: { repository: 'https://github.com/microtaro/other' } }),
    offlineRelease({ updateManifestUrl: 'https://example.invalid/manifest.json' }),
  ];

  for (const release of invalidReleases) {
    const fixture = writeRelease(release);
    t.after(() => fs.rmSync(fixture.root, { recursive: true, force: true }));
    let requests = 0;
    const result = await checkForUpdate({
      releasePath: fixture.releasePath,
      cacheDirectory: path.join(fixture.root, 'cache'),
      fetchImpl: async () => {
        requests += 1;
        throw new Error('invalid metadata must not fetch');
      },
    });

    assert.deepEqual(result, { status: 'silent', reason: 'invalid-local-release' });
    assert.equal(requests, 0);
    assert.equal(fs.existsSync(path.join(fixture.root, 'cache')), false);
  }
});
