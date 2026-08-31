import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractSvgs, parseXml } from './helpers/xml.mjs';
import { CLI_MESSAGES_JA, CLI_MESSAGE_SOURCES } from '../renderers/shared/i18n.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-cli-'));
const cli = path.join(skillRoot, 'bin/archify.mjs');
const cliMessageReview = path.join(skillRoot, 'references', 'cli-messages.ja-review.md');
const cliBaseEnglishFixture = path.join(skillRoot, 'test', 'fixtures', 'cli-message-sources.en.json');
const cliDownstreamEnglishFixture = path.join(skillRoot, 'test', 'fixtures', 'cli-message-downstream-sources.en.json');

function run(args, options = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: options.cwd || skillRoot,
    encoding: 'utf8',
    env: options.env || process.env,
  });
}

function sha256(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function englishMessageFixtures() {
  return {
    ...JSON.parse(fs.readFileSync(cliBaseEnglishFixture, 'utf8')),
    ...JSON.parse(fs.readFileSync(cliDownstreamEnglishFixture, 'utf8')),
  };
}

function makeFakeOpeners(name, { exitCode = 0 } = {}) {
  const bin = path.join(tmp, name);
  const log = path.join(bin, 'open-log.json');
  fs.mkdirSync(bin, { recursive: true });
  const source = `#!/usr/bin/env node
const fs = require('node:fs');
const target = process.argv[process.argv.length - 1];
fs.writeFileSync(process.env.ARCHIFY_TEST_OPEN_LOG, JSON.stringify({
  argv: process.argv.slice(2),
  target,
  existed: fs.existsSync(target),
}));
process.exit(${exitCode});
`;
  for (const command of ['open', 'xdg-open']) {
    const executable = path.join(bin, command);
    fs.writeFileSync(executable, source);
    fs.chmodSync(executable, 0o755);
  }
  return {
    log,
    env: {
      ...process.env,
      PATH: `${bin}${path.delimiter}${process.env.PATH || ''}`,
      ARCHIFY_TEST_OPEN_LOG: log,
    },
  };
}

function copyInstalledSkill(target) {
  fs.cpSync(skillRoot, target, {
    recursive: true,
    filter(source) {
      const rel = path.relative(skillRoot, source);
      return rel !== 'node_modules' && !rel.startsWith(`node_modules${path.sep}`)
        && rel !== 'test' && !rel.startsWith(`test${path.sep}`)
        // Another test creates this short-lived directory under skillRoot so
        // Ajv resolves from the checkout. Never copy a concurrently removed
        // test fixture into an installed-skill simulation.
        && !rel.startsWith('.validator-check-');
    },
  });
}

test('cli: no arguments presents Japanese usage without translating commands or options', () => {
  const result = run([]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^使い方:\n/);
  assert.match(result.stdout, /種類:\n  architecture, workflow, sequence, dataflow, lifecycle/);
  assert.match(result.stdout, /archify validate <type> <input\.json> \[--json\] \[--layout-json\]/);
  assert.match(result.stdout, /--repo-root path \(architecture のみ\)/);
});

test('cli: unknown command is Japanese while preserving the command and exit contract', () => {
  const result = run(['frobnicate']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^不明なコマンド "frobnicate"。\n\n使い方:/);
});

test('cli: option requirements and command-specific usage are Japanese without translating options', () => {
  const cases = [
    {
      args: ['compare', 'architecture', 'base.json', 'head.json', '--receipt'],
      expected: /--receipt には JSON 出力パスが必要です。/,
    },
    {
      args: ['guide', '--lang', 'ja'],
      expected: /--lang には "en" または "zh" を指定してください。/,
    },
    {
      args: ['brands', 'capture'],
      expected: /使い方: archify brands capture <url> \[--json\]/,
    },
    {
      args: ['migrate', 'workflow', 'old.json', 'new.json', '--to-schema'],
      expected: /--to-schema にはスキーマバージョンが必要です。/,
    },
    {
      args: ['validate', 'workflow', 'input.json', '--quality'],
      expected: /--quality には standard または showcase が必要です。/,
    },
  ];

  for (const { args, expected } of cases) {
    const result = run(args);
    assert.equal(result.status, 2, args.join(' '));
    assert.equal(result.stdout, '');
    assert.match(result.stderr, expected);
  }
});

test('cli: propagated brand capture validation is Japanese while retaining HTTP(S)', () => {
  const result = run(['brands', 'capture', 'ftp://example.com/favicon.ico']);

  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /brand capture には HTTP\(S\) URL を 1 つ指定してください。/);
  assert.doesNotMatch(result.stderr, /requires one HTTP/);
});

test('cli: Japanese review table records exact English source and direct translation', () => {
  const markdown = fs.readFileSync(cliMessageReview, 'utf8');
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
  const reviewed = new Map(rows.map((row) => [row.key, row]));

  const englishFixtures = englishMessageFixtures();
  const expectedKeys = Object.keys(englishFixtures).sort();
  assert.deepEqual(Object.keys(CLI_MESSAGE_SOURCES).sort(), expectedKeys);
  assert.deepEqual(Object.keys(CLI_MESSAGES_JA).sort(), expectedKeys);
  assert.deepEqual([...reviewed.keys()].sort(), expectedKeys);
  assert.equal(new Set(rows.map((row) => row.key)).size, rows.length);
  for (const row of rows) {
    assert.equal(row.english, englishFixtures[row.key], `English source fixture: ${row.key}`);
    assert.equal(CLI_MESSAGE_SOURCES[row.key], englishFixtures[row.key], `Production English source: ${row.key}`);
    assert.equal(row.japanese, CLI_MESSAGES_JA[row.key], `Japanese review: ${row.key}`);
    const englishVariables = [...row.english.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]).sort();
    const japaneseVariables = [...row.japanese.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((match) => match[1]).sort();
    assert.deepEqual(japaneseVariables, englishVariables, `interpolation variables: ${row.key}`);
  }
  assert.deepEqual(reviewed.get('usage.heading'), {
    key: 'usage.heading',
    english: 'Usage:',
    japanese: '使い方:',
  });
  assert.deepEqual(reviewed.get('error.unknown-command'), {
    key: 'error.unknown-command',
    english: 'Unknown command "{command}".',
    japanese: '不明なコマンド "{command}"。',
  });
  assert.deepEqual(reviewed.get('doctor.ready'), {
    key: 'doctor.ready',
    english: 'Archify is ready.',
    japanese: 'Archify を使用できます。',
  });
  assert.deepEqual(reviewed.get('schema.additional-properties.fix'), {
    key: 'schema.additional-properties.fix',
    english: 'remove unsupported property {property}',
    japanese: '未対応のプロパティ {property} を削除してください',
  });
});

test('cli: e827188 English producer fixture independently pins the complete reviewed catalog', () => {
  const baseBytes = fs.readFileSync(cliBaseEnglishFixture);
  const downstreamBytes = fs.readFileSync(cliDownstreamEnglishFixture);
  const base = JSON.parse(baseBytes);
  const downstream = JSON.parse(downstreamBytes);
  const canonical = JSON.stringify(Object.fromEntries(Object.entries(base).sort(([left], [right]) => left.localeCompare(right))));

  assert.equal(Object.keys(base).length, 177);
  assert.equal(Object.keys(downstream).length, 16);
  assert.equal(createHash('sha256').update(baseBytes).digest('hex'), 'f87df7ba4f1d4d455baa886b0ab9372e42699298cd260c1cda35463c9bd3d736');
  assert.equal(createHash('sha256').update(downstreamBytes).digest('hex'), 'b9f8dfa1b3308f81f8fb607698cf0f5e35233b96b33f66cbda49d44508841576');
  assert.equal(
    createHash('sha256').update(canonical).digest('hex'),
    'a2b586de10d658fb6569b2d3c0d37b264031b0cd6cf3a3b2103338589ca6681d',
  );
  assert.equal(base['error.quality-required'], '--quality requires standard or showcase.');
  assert.equal(base['error.receipt-required'], '--receipt requires a JSON output path.');
  assert.equal(base['error.lang-values'], '--lang must be "en" or "zh".');
  assert.equal(base['usage.brands-capture'], 'Usage: archify brands capture <url> [--json]');
  assert.equal(base['error.to-schema-required'], '--to-schema requires a schema version.');
  assert.equal(base['doctor.file-missing.one'], '{count} required file missing');
  assert.equal(base['doctor.file-missing.other'], '{count} required files missing');
  assert.equal(base['doctor.runtime-failed.one'], '{count} runtime check failed');
  assert.equal(base['doctor.runtime-failed.other'], '{count} runtime checks failed');
  assert.equal(downstream['brand.http-only'], 'only HTTP(S) brand links are supported');
  assert.equal(downstream['checker.single-svg-detail'], 'found {count} <svg> block(s)');
});

test('cli: every fixed human-facing producer routes through the reviewed Japanese catalog', () => {
  const source = fs.readFileSync(cli, 'utf8');
  const candidates = source.split('\n').filter((line) => (
    /\b(?:fail|console\.(?:log|error))\s*\(/.test(line)
    || /\b(?:message|error|supportedFixes):/.test(line)
    || /\bconst message\s*=/.test(line)
  ));
  const literalProducers = candidates.filter((line) => /['"`]/.test(line));
  const allowedMachineOnly = [
    "console.log('  archify render architecture <input.json> <output.html>');",
    "console.log(`[${check.ok ? 'ok' : (check.failureLabel || 'missing')}] ${check.label}`);",
  ];
  const violations = literalProducers
    .filter((line) => !line.includes('translateCliMessage('))
    .filter((line) => !line.includes('JSON.stringify('))
    .filter((line) => !line.includes('fail(usage())'))
    .filter((line) => !line.includes('entries.map((mark) => mark.id)'))
    .filter((line) => !allowedMachineOnly.includes(line.trim()))
    .filter((line) => !/\b(?:message|error):\s*(?:error|failure|payload|primary|outputDiagnostic|diagnosticEntry)\b/.test(line))
    .filter((line) => !/supportedFixes:\s*(?:details|outputDiagnostic|diagnosticEntry|\[\.\.\.)/.test(line))
    .map((line) => line.trim());
  assert.deepEqual(violations, []);
});

test('cli: downstream producer fixture is mapped at the propagation boundary', () => {
  const binSource = fs.readFileSync(cli, 'utf8');
  const downstreamSource = [
    fs.readFileSync(path.join(skillRoot, 'renderers', 'shared', 'brand-marks.mjs'), 'utf8'),
    fs.readFileSync(path.join(skillRoot, 'scripts', 'check-render-output.mjs'), 'utf8'),
  ].join('\n');
  const fixture = JSON.parse(fs.readFileSync(cliDownstreamEnglishFixture, 'utf8'));

  for (const [key, english] of Object.entries(fixture)) {
    const anchor = english.split(/\{[a-zA-Z0-9_]+\}/).sort((left, right) => right.length - left.length)[0];
    assert.ok(anchor.length >= 8 && downstreamSource.includes(anchor), `downstream English producer: ${key}`);
    assert.ok(binSource.includes(`'${key}'`), `propagation mapping: ${key}`);
  }
});

test('cli: help lists commands and diagram types', () => {
  const result = run(['--help']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /archify render <type>/);
  assert.match(result.stdout, /archify compare architecture <base\.json> <head\.json>/);
  assert.match(result.stdout, /archify deliver <type>/);
  assert.match(result.stdout, /archify preview <type>/);
  assert.match(result.stdout, /archify visual-check <output\.html>/);
  assert.match(result.stdout, /--open/);
  assert.match(result.stdout, /--repo-root path \(architecture のみ\)/);
  assert.match(result.stdout, /archify guide \[シナリオまたは質問\]/);
  assert.match(result.stdout, /archify doctor/);
  assert.match(result.stdout, /archify demo \[出力ディレクトリ\]/);
  assert.match(result.stdout, /architecture, workflow, sequence, dataflow, lifecycle/);
});

test('cli: doctor reports a complete installation is ready', () => {
  const result = run(['doctor']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\[ok\] Node\.js v\d+/);
  assert.match(result.stdout, /\[ok\] コアテンプレート/);
  assert.match(result.stdout, /\[ok\] サンプルレンダラー/);
  assert.match(result.stdout, /\[ok\] ライブプレビュー実行環境/);
  assert.match(result.stdout, /\[ok\] シナリオレシピガイド/);
  assert.match(result.stdout, /\[ok\] 段階的な作成ガイド/);
  assert.match(result.stdout, /\[ok\] アーキテクチャ比較の実行環境と証跡用データ/);
  assert.match(result.stdout, /\[ok\] スタンドアロンのスキーマ検証器/);
  assert.match(result.stdout, /\[ok\] architecture のレンダラー、スキーマ、サンプル/);
  assert.match(result.stdout, /\[ok\] lifecycle のレンダラー、スキーマ、サンプル/);
  assert.match(result.stdout, /Archify を使用できます。/);
});

test('cli: doctor identifies an incomplete installation', () => {
  const incompleteRoot = path.join(tmp, 'incomplete-skill');
  const incompleteBin = path.join(incompleteRoot, 'bin');
  fs.mkdirSync(incompleteBin, { recursive: true });
  fs.copyFileSync(cli, path.join(incompleteBin, 'archify.mjs'));

  const result = spawnSync(process.execPath, [path.join(incompleteBin, 'archify.mjs'), 'doctor'], {
    cwd: incompleteRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[missing\] コアテンプレート/);
  assert.match(result.stdout, /\[missing\] シナリオレシピガイド/);
  assert.match(result.stdout, /\[missing\] workflow のレンダラー、スキーマ、サンプル/);
  assert.match(result.stderr, /Archify を使用できません: 必要なファイルが \d+ 件ありません。/);
});

test('cli: doctor rejects a corrupt standalone validator', () => {
  const corruptRoot = path.join(tmp, 'corrupt-skill');
  copyInstalledSkill(corruptRoot);
  fs.writeFileSync(path.join(corruptRoot, 'renderers/shared/generated-validators.mjs'), 'export const workflow = ;\n');

  const result = spawnSync(process.execPath, [path.join(corruptRoot, 'bin/archify.mjs'), 'doctor'], {
    cwd: corruptRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[invalid\] スタンドアロンのスキーマ検証器/);
  assert.match(result.stderr, /Archify を使用できません: 実行時検査が 1 件失敗しました。/);
});

test('cli: examples renders from an installed skill', () => {
  const installedRoot = path.join(tmp, 'installed-skill');
  copyInstalledSkill(installedRoot);

  const result = spawnSync(process.execPath, [path.join(installedRoot, 'bin/archify.mjs'), 'examples'], {
    cwd: installedRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  for (const output of [
    'workflow-agent-tool-call-rendered.html',
    'sequence-cache-miss-request.html',
    'dataflow-product-analytics.html',
    'lifecycle-agent-run.html',
    'web-app-rendered.html',
  ]) {
    assert.equal(fs.existsSync(path.join(installedRoot, 'examples', output)), true, output);
  }
});

test('cli: guide lists all scenario recipes by diagram type', () => {
  const result = run(['guide']);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Archify scenario recipes \(11\)/);
  for (const type of ['architecture', 'workflow', 'sequence', 'dataflow', 'lifecycle']) {
    assert.match(result.stdout, new RegExp(`\\[${type}\\]`));
  }
});

test('cli: guide recommends a scenario as structured json', () => {
  const result = run(['guide', 'Show an API request with Redis cache miss', '--json']);

  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.lang, 'en');
  assert.equal(parsed.confidence, 'high');
  assert.equal(parsed.recommendation.id, 'api-request');
  assert.equal(parsed.recommendation.type, 'sequence');
});

test('cli: guide works from an installed skill without node_modules', () => {
  const installedRoot = path.join(tmp, 'installed-guide-skill');
  copyInstalledSkill(installedRoot);
  const installedCli = path.join(installedRoot, 'bin/archify.mjs');

  const result = spawnSync(process.execPath, [installedCli, 'guide', 'incident-runbook', '--json'], {
    cwd: installedRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).recommendation.id, 'incident-runbook');
});

test('cli: demo creates a ready-to-open diagram in a chosen directory', () => {
  const outputDirectory = path.join(tmp, 'my-demo');
  const output = path.join(outputDirectory, 'archify-demo.html');
  const result = run(['demo', outputDirectory]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(output), true);
  assert.match(fs.readFileSync(output, 'utf8'), /Sample Web App のダイアグラム/);
  assert.match(result.stdout, new RegExp(`デモを用意しました: ${output.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  assert.match(result.stdout, /次: HTML をブラウザーで開き/);
  assert.match(result.stdout, /archify render architecture/);
});

test('cli: demo defaults to the current directory', () => {
  const workingDirectory = path.join(tmp, 'default-demo');
  fs.mkdirSync(workingDirectory);
  const result = run(['demo'], { cwd: workingDirectory });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(workingDirectory, 'archify-demo.html')), true);
});

test('cli: render writes a diagram html file', () => {
  const out = path.join(tmp, 'workflow.html');
  const input = path.join(skillRoot, 'examples/agent-tool-call.workflow.json');
  const result = run(['render', 'workflow', input, out]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(out), true);
  assert.match(fs.readFileSync(out, 'utf8'), /Agent Tool Call Workflow/);
});

test('cli: visual-check returns a skipped receipt with exit 2 when Chrome is unavailable', () => {
  const out = path.join(tmp, 'visual-check-skipped.html');
  fs.writeFileSync(out, '<!doctype html><html><body>delivered</body></html>');
  const missingChrome = path.join(tmp, 'missing-chrome');
  const result = run(['visual-check', out, '--json'], {
    env: { ...process.env, ARCHIFY_CHROME: missingChrome },
  });

  assert.equal(result.status, 2, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.status, 'skipped');
  assert.equal(receipt.visualReview, 'pending');
  assert.equal(receipt.chrome.status, 'unavailable');
  assert.equal(fs.existsSync(out.replace(/\.html$/, '.visual-check.json')), true);
});

test('cli: deliver atomically writes a checked artifact and structured receipt', () => {
  const out = path.join(tmp, 'delivered-workflow.html');
  const input = path.join(skillRoot, 'examples/agent-tool-call.workflow.json');
  const result = run(['deliver', 'workflow', input, out, '--quality', 'showcase', '--json']);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(out), true);
  assert.match(fs.readFileSync(out, 'utf8'), /Agent Tool Call Workflow/);

  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.schemaVersion, 1);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.command, 'deliver');
  assert.equal(receipt.type, 'workflow');
  assert.equal(receipt.input, input);
  assert.equal(receipt.output, out);
  assert.deepEqual(receipt.specification, {
    sha256: sha256(input),
    bytes: fs.statSync(input).size,
  });
  assert.match(receipt.artifact.sha256, /^[a-f0-9]{64}$/);
  assert.equal(receipt.artifact.sha256, sha256(out));
  assert.equal(receipt.artifact.bytes, fs.statSync(out).size);
  assert.deepEqual(receipt.validation, {
    checksPassed: 9,
    checkCount: 9,
    compositionProfile: 'showcase',
    compositionStatus: 'pass',
    errors: 0,
    warnings: 0,
  });
  assert.equal('open' in receipt, false);
});

test('cli: deliver --open launches only the committed absolute artifact as one argument', {
  skip: process.platform === 'win32',
}, () => {
  const fake = makeFakeOpeners('successful-open');
  const out = path.join(tmp, `-复杂 path 'quoted'`, 'verified diagram.html');
  const input = path.join(skillRoot, 'examples/agent-tool-call.workflow.json');
  const result = run(['deliver', 'workflow', input, out, '--open', '--json'], { env: fake.env });

  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.deepEqual(receipt.open, {
    requested: true,
    status: 'opened',
    target: out,
    method: process.platform === 'darwin' ? 'open' : 'xdg-open',
  });
  const invocation = JSON.parse(fs.readFileSync(fake.log, 'utf8'));
  assert.equal(invocation.existed, true, 'the opener must run after the atomic commit');
  assert.deepEqual(invocation.argv, [out]);
  assert.equal(invocation.target, out);
  assert.equal(fs.existsSync(out), true);
});

test('cli: opener failure does not invalidate a verified delivery or pollute json stdout', {
  skip: process.platform === 'win32',
}, () => {
  const fake = makeFakeOpeners('failed-open', { exitCode: 17 });
  const out = path.join(tmp, 'open-failure-preserves-delivery.html');
  const input = path.join(skillRoot, 'examples/web-app.architecture.json');
  const result = run(['deliver', 'architecture', input, out, '--open', '--json'], { env: fake.env });

  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.open.status, 'failed');
  assert.equal(receipt.open.target, out);
  assert.match(result.stderr, /検証済み成果物を開けませんでした/);
  assert.match(result.stderr, new RegExp(out.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(fs.existsSync(out), true);
  assert.equal(receipt.artifact.sha256, sha256(out));
});

test('cli: deliver failure never invokes the optional opener', {
  skip: process.platform === 'win32',
}, () => {
  const fake = makeFakeOpeners('never-open');
  const input = path.join(tmp, 'invalid-open-delivery.json');
  fs.writeFileSync(input, '{broken json');
  const out = path.join(tmp, 'must-not-open.html');
  const result = run(['deliver', 'architecture', input, out, '--open', '--json'], { env: fake.env });

  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).stage, 'input');
  assert.equal(fs.existsSync(fake.log), false);
  assert.equal(fs.existsSync(out), false);
});

test('cli: a missing optional opener module preserves verified delivery with a fallback receipt', () => {
  const installedRoot = path.join(tmp, 'missing-open-module-skill');
  copyInstalledSkill(installedRoot);
  const installedCli = path.join(installedRoot, 'bin/archify.mjs');
  fs.rmSync(path.join(installedRoot, 'bin/open-artifact.mjs'));
  const input = path.join(installedRoot, 'examples/agent-tool-call.workflow.json');
  const out = path.join(tmp, 'missing-open-module-delivery.html');

  const result = spawnSync(process.execPath, [installedCli, 'deliver', 'workflow', input, out, '--open', '--json'], {
    cwd: installedRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.ok, true);
  assert.deepEqual(receipt.open, {
    requested: true,
    status: 'unsupported',
    target: out,
    method: null,
  });
  assert.match(result.stderr, /手動で開いてください/);
  assert.equal(receipt.artifact.sha256, sha256(out));
});

test('cli: deliver preserves the renderer default output contract', () => {
  const workingDirectory = path.join(tmp, 'delivery-default-output');
  fs.mkdirSync(workingDirectory, { recursive: true });
  const input = path.join(workingDirectory, 'source.architecture.json');
  const source = JSON.parse(fs.readFileSync(path.join(skillRoot, 'examples/web-app.architecture.json'), 'utf8'));
  source.meta.output = 'verified-default.html';
  fs.writeFileSync(input, JSON.stringify(source));

  const result = run(['deliver', 'architecture', input, '--json'], { cwd: workingDirectory });
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.output, path.join(fs.realpathSync(workingDirectory), 'verified-default.html'));
  assert.equal(fs.existsSync(receipt.output), true);
});

test('cli: deliver works from an installed skill without node_modules', () => {
  const installedRoot = path.join(tmp, 'installed-deliver-skill');
  copyInstalledSkill(installedRoot);
  const installedCli = path.join(installedRoot, 'bin/archify.mjs');
  const cases = [
    ['architecture-boundaries', 'architecture', 'production-deployment.architecture.json'],
    ['architecture-issue-110', 'architecture', 'brand-aware-delivery.architecture.json'],
    ['workflow', 'workflow', 'agent-tool-call.workflow.json'],
    ['sequence', 'sequence', 'cache-miss-request.sequence.json'],
    ['dataflow', 'dataflow', 'product-analytics.dataflow.json'],
    ['lifecycle', 'lifecycle', 'agent-run.lifecycle.json'],
  ];

  for (const [label, type, example] of cases) {
    const input = path.join(installedRoot, 'examples', example);
    const out = path.join(tmp, `installed-${label}-delivery.html`);
    const result = spawnSync(process.execPath, [installedCli, 'deliver', type, input, out, '--json'], {
      cwd: installedRoot,
      encoding: 'utf8',
    });

    assert.equal(result.status, 0, `${label}: ${result.stderr}`);
    assert.equal(JSON.parse(result.stdout).validation.checkCount, 9, label);
    assert.equal(fs.existsSync(out), true, label);
    const extracted = extractSvgs(fs.readFileSync(out, 'utf8'));
    assert.equal(extracted.direct.length, 1, `${label}: expected one delivered SVG`);
    assert.doesNotThrow(
      () => parseXml(extracted.direct[0]),
      `${label}: delivered SVG must be well-formed XML`,
    );
  }
});

test('cli: deliver XML guard parses markup instead of scanning attribute-like text', () => {
  assert.doesNotThrow(() => parseXml(
    '<svg xmlns="http://www.w3.org/2000/svg" aria-label="mentions data-node-label safely"/>',
  ));
  assert.throws(
    () => parseXml('<svg xmlns="http://www.w3.org/2000/svg" data-node-label></svg>'),
    /attribute without value/i,
  );
  assert.throws(
    () => parseXml('<svg xmlns="http://www.w3.org/2000/svg"><g></svg>'),
    /unexpected close tag/i,
  );
});

test('cli: preview runs from an installed skill without node_modules and exits cleanly', { timeout: 30000 }, async () => {
  const installedRoot = path.join(tmp, 'installed-preview-skill');
  copyInstalledSkill(installedRoot);
  const installedCli = path.join(installedRoot, 'bin/archify.mjs');
  const input = path.join(installedRoot, 'examples/web-app.architecture.json');
  const output = path.join(tmp, 'installed-preview.html');
  const child = spawn(process.execPath, [installedCli, 'preview', 'architecture', input, output, '--quality', 'showcase', '--no-open'], {
    cwd: installedRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });

  let previewUrl;
  const started = Date.now();
  while (!previewUrl && Date.now() - started < 8000) {
    previewUrl = stdout.match(/preview (http:\/\/127\.0\.0\.1:\d+\/)/)?.[1];
    if (!previewUrl) await new Promise((resolve) => setTimeout(resolve, 40));
  }
  assert.ok(previewUrl, `preview URL missing; stdout=${stdout}; stderr=${stderr}`);

  let state;
  while (Date.now() - started < 15000) {
    state = await fetch(new URL('/state', previewUrl)).then((response) => response.json());
    if (state.status === 'verified') break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(state?.status, 'verified', `preview did not verify; stdout=${stdout}; stderr=${stderr}`);
  assert.equal(state.revision, 1);
  assert.equal(fs.existsSync(output), true);

  child.kill('SIGTERM');
  const exit = await new Promise((resolve) => child.once('close', (code, signal) => resolve({ code, signal })));
  assert.deepEqual(exit, { code: 0, signal: null });
  assert.match(stdout, /stopping preview/);
  await assert.rejects(fetch(previewUrl));
  assert.deepEqual(fs.readdirSync(path.dirname(output)).filter((name) => name.startsWith('.archify-preview-')), []);
});

test('cli: deliver preserves the previous artifact when the final check fails', () => {
  const installedRoot = path.join(tmp, 'broken-deliver-skill');
  copyInstalledSkill(installedRoot);
  const installedCli = path.join(installedRoot, 'bin/archify.mjs');
  const templatePath = path.join(installedRoot, 'assets/template.html');
  const template = fs.readFileSync(templatePath, 'utf8');
  fs.writeFileSync(templatePath, template.replace('</body>', '<svg aria-label="accidental second svg"></svg>\n</body>'));

  const input = path.join(installedRoot, 'examples/web-app.architecture.json');
  const out = path.join(tmp, 'preserved-delivery.html');
  const trustedPriorArtifact = '<!doctype html><title>trusted prior artifact</title>\n';
  fs.writeFileSync(out, trustedPriorArtifact);

  const result = spawnSync(process.execPath, [installedCli, 'deliver', 'architecture', input, out, '--json'], {
    cwd: installedRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  const failure = JSON.parse(result.stdout);
  assert.equal(failure.ok, false);
  assert.equal(failure.stage, 'check');
  assert.equal(failure.diagnostics[0].code, 'artifact/single-svg');
  assert.equal(failure.diagnostics[0].subject.check, 'single_svg');
  assert.equal(failure.diagnostics[0].message, '<svg> ブロックが 2 個見つかりました');
  assert.deepEqual(failure.diagnostics[0].evidence.details, ['found 2 <svg> block(s)']);
  assert.ok(failure.diagnostics[0].supportedFixes.some((fix) => fix.includes('ダイアグラム SVG が 1 つだけ')));
  assert.equal(failure.checker.checks.find((entry) => entry.name === 'single_svg').ok, false);
  assert.equal(fs.readFileSync(out, 'utf8'), trustedPriorArtifact);
  assert.deepEqual(
    fs.readdirSync(path.dirname(out)).filter((name) => name.includes('.archify-delivery-')),
    [],
  );
});

test('cli: deliver reports renderer failure as json and preserves the previous artifact', () => {
  const input = path.join(tmp, 'invalid-delivery.workflow.json');
  const source = JSON.parse(fs.readFileSync(path.join(skillRoot, 'examples/agent-tool-call.workflow.json'), 'utf8'));
  source.nodes[0].unexpected = true;
  fs.writeFileSync(input, JSON.stringify(source));

  const out = path.join(tmp, 'renderer-failure-preserved.html');
  const trustedPriorArtifact = '<!doctype html><title>last known good</title>\n';
  fs.writeFileSync(out, trustedPriorArtifact);

  const result = run(['deliver', 'workflow', input, out, '--json']);
  assert.equal(result.status, 1);
  const failure = JSON.parse(result.stdout);
  assert.equal(failure.ok, false);
  assert.equal(failure.stage, 'render');
  assert.match(failure.error, /スキーマ検証に失敗しました/);
  assert.equal(fs.readFileSync(out, 'utf8'), trustedPriorArtifact);
});

test('cli: deliver reports unreadable input as json without touching the target', () => {
  const input = path.join(tmp, 'malformed-delivery.json');
  fs.writeFileSync(input, '{not valid json');
  const out = path.join(tmp, 'malformed-input-preserved.html');
  const trustedPriorArtifact = '<!doctype html><title>still trusted</title>\n';
  fs.writeFileSync(out, trustedPriorArtifact);

  const result = run(['deliver', 'architecture', input, out, '--json']);
  assert.equal(result.status, 1);
  const failure = JSON.parse(result.stdout);
  assert.equal(failure.ok, false);
  assert.equal(failure.stage, 'input');
  assert.match(failure.error, /配布入力 .* を読み込めませんでした/);
  assert.equal(fs.readFileSync(out, 'utf8'), trustedPriorArtifact);
});

test('cli: invalid source output metadata still fails inside the renderer', () => {
  const workingDirectory = path.join(tmp, 'invalid-output-metadata');
  fs.mkdirSync(workingDirectory, { recursive: true });
  const input = path.join(workingDirectory, 'source.architecture.json');
  const source = JSON.parse(fs.readFileSync(path.join(skillRoot, 'examples/web-app.architecture.json'), 'utf8'));
  source.meta.output = 17;
  fs.writeFileSync(input, JSON.stringify(source));
  const out = path.join(workingDirectory, 'architecture.html');
  const trustedPriorArtifact = '<!doctype html><title>metadata did not replace me</title>\n';
  fs.writeFileSync(out, trustedPriorArtifact);

  const result = run(['deliver', 'architecture', input, '--json'], { cwd: workingDirectory });
  assert.equal(result.status, 1);
  const failure = JSON.parse(result.stdout);
  assert.equal(failure.stage, 'render');
  assert.match(failure.error, /スキーマ検証に失敗しました/);
  assert.match(failure.diagnostics[0].message, /型は "string" でなければなりません/);
  assert.deepEqual(failure.diagnostics[0].supportedFixes, [
    '/meta/output には "string" を使用してください',
  ]);
  assert.equal(fs.readFileSync(out, 'utf8'), trustedPriorArtifact);
});

test('cli: deliver reports commit failure without a false success receipt', () => {
  const input = path.join(skillRoot, 'examples/web-app.architecture.json');
  const outputDirectory = path.join(tmp, 'commit-target-is-a-directory');
  fs.mkdirSync(outputDirectory, { recursive: true });

  const result = run(['deliver', 'architecture', input, outputDirectory, '--json']);
  assert.equal(result.status, 1);
  const failure = JSON.parse(result.stdout);
  assert.equal(failure.ok, false);
  assert.equal(failure.stage, 'commit');
  assert.match(failure.error, /検証済み配布 .* を確定できませんでした/);
  assert.equal(fs.statSync(outputDirectory).isDirectory(), true);
  assert.equal(fs.readdirSync(outputDirectory).length, 0);
});

test('cli: deliver reports preparation failure as json without touching the blocker', () => {
  const input = path.join(skillRoot, 'examples/web-app.architecture.json');
  const blockingFile = path.join(tmp, 'delivery-parent-is-a-file');
  fs.writeFileSync(blockingFile, 'do not replace me');
  const out = path.join(blockingFile, 'cannot-write.html');

  const result = run(['deliver', 'architecture', input, out, '--json']);
  assert.equal(result.status, 1);
  const failure = JSON.parse(result.stdout);
  assert.equal(failure.ok, false);
  assert.equal(failure.stage, 'prepare');
  assert.match(failure.error, /配布ディレクトリ .* を作成できませんでした/);
  assert.equal(fs.readFileSync(blockingFile, 'utf8'), 'do not replace me');
});

test('cli: check validates rendered html', () => {
  const out = path.join(tmp, 'workflow-check.html');
  const input = path.join(skillRoot, 'examples/agent-tool-call.workflow.json');
  assert.equal(run(['render', 'workflow', input, out]).status, 0);

  const result = run(['check', out]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"ok": true/);
});

test('cli: validate emits structured json without keeping html output', () => {
  const input = path.join(skillRoot, 'examples/agent-tool-call.workflow.json');
  const before = new Set(fs.readdirSync(tmp));
  const result = run(['validate', 'workflow', input, '--json']);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'workflow');
  assert.equal(parsed.checks.length, 9);
  assert.equal(parsed.composition.profile, 'showcase');
  assert.deepEqual(parsed.composition.summary, { errors: 0, warnings: 0 });
  assert.equal(parsed.composition.metrics.containerBorderRuns, 0);
  assert.equal(parsed.composition.metrics.ambiguousCorridors, 0);
  assert.deepEqual(new Set(fs.readdirSync(tmp)), before);
});

test('cli: validate JSON exposes only the primary v1 column-capacity diagnostic', () => {
  const input = path.join(tmp, 'pinned-column-capacity.workflow.json');
  fs.writeFileSync(input, `${JSON.stringify({
    schema_version: 1,
    diagram_type: 'workflow',
    meta: {
      title: 'Pinned issue 126 diagnostic boundary',
      viewBox: [720, 400],
      legend: { mode: 'hidden' },
    },
    lanes: [{ id: 'main', label: 'Main' }],
    nodes: [
      { id: 'a', lane: 'main', col: 1, type: 'backend', label: 'A' },
      { id: 'b', lane: 'main', col: 2, type: 'backend', label: 'B' },
    ],
    edges: [{
      id: 'ab',
      from: 'a',
      to: 'b',
      fromSide: 'top',
      toSide: 'top',
      via: [[220, 60], [300, 60]],
    }],
  }, null, 2)}\n`);

  const result = run(['validate', 'workflow', input, '--json'], {
    env: { ...process.env, ARCHIFY_DIAGNOSTIC_FORMAT: 'json' },
  });

  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  const failure = JSON.parse(result.stdout);
  assert.equal(failure.ok, false);
  assert.equal(failure.command, 'validate');
  assert.equal(failure.stage, 'render');
  assert.equal(failure.type, 'workflow');
  assert.equal(failure.diagnostics.length, 1, JSON.stringify(failure.diagnostics, null, 2));
  const [primary] = failure.diagnostics;
  assert.equal(primary.code, 'workflow/column-capacity');
  assert.equal(primary.subject.edge, 'ab');
  assert.equal(primary.subject.fromCol, 1);
  assert.equal(primary.subject.toCol, 2);
  assert.ok(primary.supportedFixes.length > 0);
  assert.ok(failure.diagnostics.every(({ code }) => (
    code !== 'workflow/explicit-pin-conflict' && code !== 'workflow/viewbox-capacity'
  )));
});

test('cli: --quality overrides the source profile for render, validate, and deliver', () => {
  const input = path.join(skillRoot, 'examples/agent-tool-call.workflow.json');
  const out = path.join(tmp, 'workflow-standard.html');
  const rendered = run(['render', 'workflow', input, out, '--quality', 'standard']);
  assert.equal(rendered.status, 0, rendered.stderr);
  assert.match(fs.readFileSync(out, 'utf8'), /data-quality-profile="standard"/);

  const validated = run(['validate', 'workflow', input, '--quality=standard', '--json']);
  assert.equal(validated.status, 0, validated.stderr);
  assert.equal(JSON.parse(validated.stdout).composition.profile, 'standard');

  const deliveredOut = path.join(tmp, 'workflow-delivered-standard.html');
  const delivered = run(['deliver', 'workflow', input, deliveredOut, '--quality=standard', '--json']);
  assert.equal(delivered.status, 0, delivered.stderr);
  assert.equal(JSON.parse(delivered.stdout).validation.compositionProfile, 'standard');
});

test('cli: rejects an unknown quality profile', () => {
  const input = path.join(skillRoot, 'examples/agent-tool-call.workflow.json');
  const result = run(['validate', 'workflow', input, '--quality', 'hero']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /standard または showcase を指定してください/);
});

test('cli: rejects a quality flag without a value', () => {
  const input = path.join(skillRoot, 'examples/agent-tool-call.workflow.json');
  for (const args of [
    ['validate', 'workflow', input, '--json', '--quality'],
    ['validate', 'workflow', input, '--quality', '--json'],
    ['validate', 'workflow', input, '--quality='],
  ]) {
    const result = run(args);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /--quality には standard または showcase が必要です/);
  }
});

test('cli: validate rejects unknown flags, layout-json assignment typos, and extra positionals', () => {
  const input = path.join(skillRoot, 'examples/agent-tool-call.workflow.json');
  const cases = [
    {
      args: ['validate', 'workflow', input, '--layout-json', '--bogus'],
      pattern: /不明な validate オプション "--bogus"/,
    },
    {
      args: ['validate', 'workflow', input, '--layout-json=true'],
      pattern: /不明な validate オプション "--layout-json=true"/,
    },
    {
      args: ['validate', 'workflow', input, '--layout-json=true', '--json'],
      pattern: /不明な validate オプション "--layout-json=true"/,
    },
    {
      args: ['validate', 'workflow', input, 'unexpected-output.html', '--layout-json'],
      pattern: /使い方:/,
    },
  ];

  for (const { args, pattern } of cases) {
    const result = run(args);
    assert.equal(result.status, 2, `${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, pattern);
  }
});

test('cli: inspect emits architecture layout json', () => {
  const input = path.resolve(skillRoot, '../examples/archify-repo-grid.architecture.json');
  const result = run(['inspect', 'architecture', input]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.diagram_type, 'architecture');
  assert.equal(parsed.layout.mode, 'grid');
  assert.ok(parsed.components.length >= 5);
  assert.ok(parsed.connections.length >= 1);
});

test('cli: inspect remains architecture-only while workflow uses validate --layout-json', () => {
  const input = path.join(skillRoot, 'examples', 'agent-tool-call.workflow.json');
  const result = run(['inspect', 'workflow', input]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /inspect は現在 architecture ダイアグラムでのみ使用できます/);
  assert.equal(result.stdout, '');
});

test('cli: validate returns renderer errors for bad input', () => {
  const input = path.join(tmp, 'bad.workflow.json');
  const validateTmp = path.join(tmp, 'validate-failure-tmp');
  const doc = JSON.parse(fs.readFileSync(path.join(skillRoot, 'examples/agent-tool-call.workflow.json'), 'utf8'));
  doc.edges[0].to = 'ghost';
  fs.writeFileSync(input, JSON.stringify(doc));
  fs.mkdirSync(validateTmp);

  const result = run(['validate', 'workflow', input], {
    env: { ...process.env, TMPDIR: validateTmp },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown target "ghost"/);
  assert.deepEqual(fs.readdirSync(validateTmp), []);
});

test('cli: validate rejects an unknown type without leaking a temp directory', () => {
  const validateTmp = path.join(tmp, 'validate-unknown-type-tmp');
  fs.mkdirSync(validateTmp);

  const result = run(['validate', 'unknown', 'ignored.json'], {
    env: {
      ...process.env,
      TMPDIR: validateTmp,
      TMP: validateTmp,
      TEMP: validateTmp,
    },
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /不明なダイアグラム種類 "unknown"/);
  assert.deepEqual(fs.readdirSync(validateTmp), []);
});

process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
