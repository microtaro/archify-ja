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
const HAN = /\p{Script=Han}/u;

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
  assert.doesNotMatch(html, HAN, `${label}: Chinese product copy remains`);
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

test('renderer publishes English as its only Viewer locale', () => {
  assert.equal(DEFAULT_LOCALE, 'en');
  assert.deepEqual(SUPPORTED_LOCALES, ['en']);
  assert.equal(translateMessage('zh-CN', 'viewer.kind.backend'), 'Backend');
  assert.ok(Object.values(viewerCatalog('en')).every((message) => !HAN.test(message)));

  const commonSchema = JSON.parse(fs.readFileSync(path.join(skillRoot, 'schemas/common.schema.json'), 'utf8'));
  assert.deepEqual(commonSchema.$defs.locale.enum, ['en']);

  const input = JSON.parse(fs.readFileSync(path.join(skillRoot, 'examples/web-app.architecture.json'), 'utf8'));
  input.meta.locale = 'zh-CN';
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-english-locale-'));
  try {
    const source = path.join(fixture, 'unsupported.architecture.json');
    fs.writeFileSync(source, `${JSON.stringify(input, null, 2)}\n`);
    const result = run('archify/bin/archify.mjs', ['validate', 'architecture', source, '--json']);
    assert.notEqual(result.status, 0, 'zh-CN must fail the public schema boundary');
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, false);
    assert.ok(payload.diagnostics.some((entry) => entry.subject?.path === '/meta/locale'));
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test('scenario APIs publish English copy and matching signals only', () => {
  assert.equal(SCENARIO_RECIPES.length, 11);
  for (const recipe of SCENARIO_RECIPES) {
    assert.ok(recipe.en?.title, `${recipe.id}: English copy missing`);
    assert.equal('zh' in recipe, false, `${recipe.id}: Chinese recipe copy remains`);
    assert.ok(recipe.signals.every(([signal]) => !HAN.test(signal)), `${recipe.id}: Chinese matching signal remains`);
    if (recipe.start) {
      assert.equal('zh' in recipe.start, false, `${recipe.id}: Chinese start copy remains`);
      assert.deepEqual(startPromptsFor(recipe), {
        descriptionPrompt: recipe.start.en.descriptionPrompt,
        repositoryPrompt: recipe.type === 'architecture'
          ? recipe.en.prompt
          : `Inspect this repository for evidence, then ${recipe.en.prompt.charAt(0).toLowerCase()}${recipe.en.prompt.slice(1)} Do not invent behavior that the code does not support.`,
      });
    }
  }

  const publicData = publicGuideData();
  assert.equal(publicData.length, 11);
  assert.ok(publicData.every((recipe) => recipe.en?.prompt && !('zh' in recipe)));
});

test('scenario English start behavior stays byte-identical after removing Chinese branches', () => {
  const prompts = SCENARIO_RECIPES
    .filter((recipe) => recipe.start)
    .map((recipe) => [recipe.id, startPromptsFor(recipe, 'en')]);
  const digest = crypto.createHash('sha256').update(JSON.stringify(prompts)).digest('hex');
  assert.equal(digest, 'd7c6063a82f140325db918672f67e0eafe51aa89434f9c086e6139d15f14128f');

  const missing = { ...SCENARIO_RECIPES[0], start: undefined };
  assert.throws(
    () => startPromptsFor(missing, 'en'),
    { message: 'Scenario recipe "system-overview" does not define a en start prompt.' },
  );
});

test('site builders and checked-in pages expose English UI without locale switching', () => {
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
