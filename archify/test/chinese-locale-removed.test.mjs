import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  translateMessage,
  viewerCatalog,
} from '../renderers/shared/i18n.mjs';
import {
  SCENARIO_RECIPES,
  publicGuideData,
  startPromptsFor,
} from '../recipes/scenarios.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(here, '..');
const repoRoot = path.resolve(skillRoot, '..');
// archify-ja renders Japanese, whose kanji are Han script, so a blanket Han
// check would flag every translated string. Chinese removal is verified by the
// structural markers below (locale switcher, data-zh, README_ZH) instead.

function run(script, args = []) {
  return spawnSync(process.execPath, [path.join(repoRoot, script), ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function assertEnglishOnlySite(html, label) {
  assert.doesNotMatch(html, /data-zh\b/, `${label}: Chinese copy attribute remains`);
  assert.doesNotMatch(html, /zh-CN|\blang(?:uage)?\s*===?\s*['"]zh['"]/, `${label}: Chinese locale branch remains`);
  assert.doesNotMatch(html, /ArchifySiteLanguage|archify-(?:lang|gallery-language|guide-language)/, `${label}: locale persistence remains`);
  assert.doesNotMatch(html, /[?&]lang=|searchParams\.(?:get|set)\(['"]lang['"]/, `${label}: locale query switching remains`);
}

function assertNoProductChineseLocale(source, label) {
  for (const pattern of [
    /README_ZH\.md/,
    /data-zh\b/,
    /\bbtn-lang\b/,
    /中文/,
    /zh-CN/,
    /ArchifySiteLanguage|site-language\.js|archify-(?:lang|gallery-language|guide-language)/,
    /[?&]lang=zh|searchParams\.(?:get|set)\(['"]lang['"]|\blang(?:uage)?\s*===?\s*['"]zh['"]/,
  ]) {
    assert.doesNotMatch(source, pattern, `${label}: product Chinese locale residue ${pattern}`);
  }
}

test('site builders and checked-in pages carry no locale switcher', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-english-site-'));
  try {
    const builds = [
      ['scripts/build-gallery.mjs', [path.join(fixture, 'gallery')], path.join(fixture, 'gallery/gallery.html')],
      ['scripts/build-guide.mjs', [path.join(fixture, 'guide/guide.html')], path.join(fixture, 'guide/guide.html')],
      ['scripts/build-start.mjs', [path.join(fixture, 'start/start.html')], path.join(fixture, 'start/start.html')],
    ];
    for (const [script, args, output] of builds) {
      const result = run(script, args);
      assert.equal(result.status, 0, `${script}: ${result.stderr || result.stdout}`);
      assertEnglishOnlySite(fs.readFileSync(output, 'utf8'), script);
    }

    for (const page of ['index.html', 'gallery.html', 'guide.html', 'start.html']) {
      assertEnglishOnlySite(fs.readFileSync(path.join(repoRoot, 'docs', page), 'utf8'), `docs/${page}`);
    }
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test('English READMEs and release identity no longer depend on a Chinese README', () => {
  for (const filename of ['README.md', 'README_EN.md']) {
    const readme = fs.readFileSync(path.join(repoRoot, filename), 'utf8');
    assert.doesNotMatch(readme, /README_ZH\.md|简体中文/, filename);
  }
  assert.equal(fs.existsSync(path.join(repoRoot, 'README_ZH.md')), false);

  const result = run('scripts/check-release-identity.mjs');
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('product-facing source and generated docs contain no Chinese locale routes or controls', () => {
  const surfaces = [
    'README.md',
    'README_EN.md',
    'docs/assets/site-navigation.css',
    'scripts/index-template.html',
    'scripts/gallery-template.html',
    'scripts/guide-template.html',
    'scripts/start-template.html',
    'scripts/build-index.mjs',
    'scripts/build-gallery.mjs',
    'scripts/build-guide.mjs',
    'scripts/build-start.mjs',
    'scripts/site-copy.mjs',
    'scripts/copy-site-assets.mjs',
    'archify/SKILL.md',
    'archify/references/authoring-contract.md',
    'archify/schemas/README.md',
    'docs/index.html',
    'docs/gallery.html',
    'docs/guide.html',
    'docs/start.html',
  ];
  for (const relative of surfaces) {
    assertNoProductChineseLocale(fs.readFileSync(path.join(repoRoot, relative), 'utf8'), relative);
  }
});
