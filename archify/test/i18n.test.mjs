import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ChromeVisualBrowser, findChrome } from '../bin/visual-check.mjs';

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  catalogKeys,
  resolveLocale,
  translateCount,
  translateMessage,
} from '../renderers/shared/i18n.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');
const cli = path.join(skillRoot, 'bin/archify.mjs');
const templatePath = path.join(skillRoot, 'assets/template.html');
const reviewTablePath = path.join(skillRoot, 'references', 'viewer-messages.ja-review.md');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-i18n-'));
const chromePath = process.env.ARCHIFY_CHROME ? findChrome() : null;
let sequence = 0;

const EXAMPLES = {
  architecture: 'web-app.architecture.json',
  workflow: 'agent-tool-call.workflow.json',
  sequence: 'cache-miss-request.sequence.json',
  dataflow: 'product-analytics.dataflow.json',
  lifecycle: 'agent-run.lifecycle.json',
};

function example(type) {
  return JSON.parse(fs.readFileSync(path.join(skillRoot, 'examples', EXAMPLES[type]), 'utf8'));
}

function run(type, document, command = 'render') {
  const id = sequence++;
  const input = path.join(tmp, `${id}-${type}.json`);
  const output = path.join(tmp, `${id}-${type}.html`);
  fs.writeFileSync(input, JSON.stringify(document));
  const args = command === 'render'
    ? [cli, 'render', type, input, output]
    : [cli, 'validate', type, input, '--json'];
  const result = spawnSync(process.execPath, args, { cwd: skillRoot, encoding: 'utf8' });
  return {
    ...result,
    output,
    html: result.status === 0 && command === 'render' ? fs.readFileSync(output, 'utf8') : '',
  };
}

async function evaluate(browser, sessionId, expression, awaitPromise = false) {
  const response = await browser.cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise,
  }, sessionId);
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description
      || response.exceptionDetails.text
      || 'browser evaluation failed');
  }
  return response.result?.value;
}

async function loadArtifact(browser, artifactPath) {
  const sessionId = await browser.sessionPromise;
  await browser.cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  }, sessionId);
  const loaded = browser.cdp.waitFor('Page.loadEventFired', sessionId);
  const navigation = await browser.cdp.send('Page.navigate', {
    url: pathToFileURL(artifactPath).href,
  }, sessionId);
  if (navigation.errorText) throw new Error(`Chrome navigation failed: ${navigation.errorText}`);
  await loaded;
  await evaluate(browser, sessionId, `new Promise(function (resolve) {
    requestAnimationFrame(function () { requestAnimationFrame(function () { resolve(true); }); });
  })`, true);
  return sessionId;
}

test('omitted locale preserves authored content and uses the Japanese Viewer contract in all five modes', () => {
  for (const type of Object.keys(EXAMPLES)) {
    const document = example(type);
    const authoredTitle = `著者作成内容-${type}`;
    document.meta.title = authoredTitle;
    delete document.meta.locale;
    delete document.meta.subtitle;

    const result = run(type, document);
    assert.equal(result.status, 0, `${type}: ${result.stderr || result.stdout}`);
    assert.match(result.html, /^<!DOCTYPE html>\n<html lang="ja-JP"/);
    assert.ok(result.html.includes(`<title>${authoredTitle} のダイアグラム</title>`), `${type}: authored title changed`);
    assert.ok(result.html.includes(`<h1>${authoredTitle}</h1>`), `${type}: authored heading changed`);
    assert.match(result.html, /<svg\b[^>]*\blang="ja-JP"/);
    assert.match(result.html, /aria-label="[^"]+にフォーカス/);
    assert.match(result.html, /"locale":"ja-JP"/);
    assert.match(result.html, />ダイアグラムを書き出す</);
  }
});

test('locale defaults to Japanese while retaining explicit English support', () => {
  assert.deepEqual(SUPPORTED_LOCALES, ['ja-JP', 'en']);
  assert.equal(DEFAULT_LOCALE, 'ja-JP');
  assert.equal(resolveLocale(undefined), 'ja-JP');
  assert.equal(resolveLocale('en'), 'en');
  for (const locale of SUPPORTED_LOCALES) {
    for (const type of Object.keys(EXAMPLES)) {
      const document = example(type);
      document.meta.locale = locale;
      const result = run(type, document, 'validate');
      assert.equal(result.status, 0, `${type}: supported locale ${locale} failed: ${result.stderr || result.stdout}`);
    }
  }
});

test('unsupported locale values fail schema validation in every mode', () => {
  for (const locale of ['fr', 'zh-CN', 'zh-HK']) {
    for (const type of Object.keys(EXAMPLES)) {
      const document = example(type);
      document.meta.locale = locale;
      const result = run(type, document, 'validate');
      assert.notEqual(result.status, 0, `${type}: unsupported locale ${locale} unexpectedly passed`);
      const payload = JSON.parse(result.stdout);
      assert.equal(payload.ok, false);
      assert.ok(payload.diagnostics.some((entry) => entry.subject?.path === '/meta/locale'), `${type}: ${locale}`);
    }
  }
});

test('every Viewer message reference resolves through the shared catalog', () => {
  const template = fs.readFileSync(templatePath, 'utf8');
  const keys = new Set(catalogKeys());
  const references = new Set([
    ...[...template.matchAll(/\{\{i18n:([a-zA-Z0-9_.-]+)\}\}/g)].map((match) => match[1]),
    ...[...template.matchAll(/['"](viewer\.[a-zA-Z0-9_.-]+)['"]/g)].map((match) => match[1]),
  ]);
  const unresolved = [...references].filter((key) => (
    !key.endsWith('.') && !keys.has(key) && !(keys.has(`${key}.one`) && keys.has(`${key}.other`))
  ));
  assert.deepEqual(unresolved, []);
});

test('Japanese and English catalogs have identical keys and interpolation variables', () => {
  const variables = (value) => [...value.matchAll(/\{([a-zA-Z0-9_]+)\}/g)]
    .map((match) => match[1])
    .sort();
  const englishKeys = [...catalogKeys('en')].sort();
  const japaneseKeys = [...catalogKeys('ja-JP')].sort();
  assert.deepEqual(japaneseKeys, englishKeys);
  for (const key of englishKeys) {
    const expected = variables(translateMessage('en', key));
    const message = translateMessage('ja-JP', key);
    assert.deepEqual(variables(message), expected, `ja-JP: ${key}`);
  }
});

test('Japanese catalog has no empty values, English fallback, or Simplified Chinese', () => {
  const simplifiedChinese = /[这为图关闭开节览显实线连达态证库导统们从]/u;
  for (const key of catalogKeys('ja-JP')) {
    const english = translateMessage('en', key);
    const japanese = translateMessage('ja-JP', key);
    assert.ok(japanese.trim(), `empty ja-JP message: ${key}`);
    assert.notEqual(japanese, english, `English fallback: ${key}`);
    assert.doesNotMatch(japanese, simplifiedChinese, `Simplified Chinese: ${key}`);
  }
});

test('Japanese representative literals preserve the reviewed UI meaning', () => {
  assert.equal(translateMessage('ja-JP', 'node.context.sequence'), 'シーケンスの参加者');
  assert.equal(translateMessage('ja-JP', 'viewer.export.share'), '共有');
  assert.equal(translateMessage('ja-JP', 'viewer.route.unreachable', { label: 'API' }), 'API への有向ルートはありません');
  assert.equal(
    translateMessage('ja-JP', 'viewer.route.unreachable.detail', { source: 'UI', target: 'DB' }),
    'UI から DB には到達できません。ハイライトされた目的地を選択してください。',
  );
});

test('Japanese review table contains every catalog key exactly once with exact source and translation', () => {
  const markdown = fs.readFileSync(reviewTablePath, 'utf8');
  const rows = markdown.split('\n')
    .filter((line) => line.startsWith('| `'))
    .map((line) => {
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
      assert.equal(cells.length, 3, line);
      return {
        key: cells[0].slice(1, -1),
        english: JSON.parse(cells[1]),
        japanese: JSON.parse(cells[2]),
      };
    });
  const expectedKeys = [...catalogKeys('en')].sort();
  const reviewedKeys = rows.map((row) => row.key);
  assert.deepEqual([...reviewedKeys].sort(), expectedKeys);
  assert.equal(new Set(reviewedKeys).size, expectedKeys.length);
  for (const row of rows) {
    assert.equal(row.english, translateMessage('en', row.key), `English source: ${row.key}`);
    assert.equal(row.japanese, translateMessage('ja-JP', row.key), `Japanese review: ${row.key}`);
  }
});

test('runtime labels stay correct after composition', () => {
  const enHop = translateCount('en', 'viewer.route.overview.hop', 1);
  const enNode = translateCount('en', 'viewer.route.overview.node', 2);
  assert.equal(
    translateMessage('en', 'viewer.route.overview.status', { nodes: enNode, hops: enHop }),
    '2 nodes · 1 directed hop · shortest authored route',
  );
  const jaHop = translateCount('ja-JP', 'viewer.route.overview.hop', 1);
  const jaNode = translateCount('ja-JP', 'viewer.route.overview.node', 2);
  assert.equal(
    translateMessage('ja-JP', 'viewer.route.overview.status', { nodes: jaNode, hops: jaHop }),
    '2 ノード · 有向 1 ホップ · 作成済みの最短ルート',
  );
});

test('Share Card and export failures use catalog messages instead of fixed English', () => {
  const template = fs.readFileSync(templatePath, 'utf8');
  for (const hardcoded of [
    "'Route: '",
    "'Share Card variants cannot be combined'",
    "canvas2dOrThrow(canvas, 'Share Card')",
    "'Share Card export could not remove temporary viewer state'",
    "'WebM motion export requires a trace animation and browser MediaRecorder support'",
  ]) {
    assert.ok(!template.includes(hardcoded), hardcoded);
  }
});
