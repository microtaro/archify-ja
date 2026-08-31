#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

let translateCliMessage;
let localizeBrandCaptureError;
let CLI_MESSAGE_SOURCES = {};
try {
  ({ CLI_MESSAGE_SOURCES, translateCliMessage, localizeBrandCaptureError } = await import('../renderers/shared/i18n.mjs'));
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  // `doctor` must still diagnose a severely incomplete installation where
  // only this entrypoint remains. Keep its Japanese output usable until the
  // missing shared runtime is reported by the checks below.
  const fallbackMessages = {
    'usage.heading': '使い方:',
    'usage.architecture-only': 'architecture のみ',
    'usage.guide-argument': 'シナリオまたは質問',
    'usage.brands-query': '名前、別名、ドメイン、またはカテゴリ',
    'usage.output-directory': '出力ディレクトリ',
    'usage.types': '種類:',
    'error.unknown-command': '不明なコマンド "{command}"。',
    'error.unknown-option': '不明な {command} オプション "{option}"。',
    'diagnostic.fix-label': '修正:',
    'doctor.heading': 'Archify 診断',
    'doctor.node': 'Node.js v{version}（18 以上が必要）',
    'doctor.core-template': 'コアテンプレート',
    'doctor.example-renderer': 'サンプルレンダラー',
    'doctor.preview-runtime': 'ライブプレビュー実行環境',
    'doctor.visual-check-runtime': 'visual-check 実行環境',
    'doctor.output-path-runtime': '出力パス安全性の実行環境',
    'doctor.scenario-guide': 'シナリオレシピガイド',
    'doctor.authoring-references': '段階的な作成ガイド',
    'doctor.compare-runtime': 'アーキテクチャ比較の実行環境と証跡用データ',
    'doctor.validators': 'スタンドアロンのスキーマ検証器',
    'doctor.renderer-bundle': '{type} のレンダラー、スキーマ、サンプル',
    'doctor.ready': 'Archify を使用できます。',
    'doctor.not-ready': 'Archify を使用できません: {problems}。',
    'doctor.node-required': 'Node.js 18 以上が必要です',
    'doctor.file-missing.one': '必要なファイルが {count} 件ありません',
    'doctor.file-missing.other': '必要なファイルが {count} 件ありません',
    'doctor.runtime-failed.one': '実行時検査が {count} 件失敗しました',
    'doctor.runtime-failed.other': '実行時検査が {count} 件失敗しました',
  };
  translateCliMessage = (key, values = {}) => String(fallbackMessages[key] || key)
    .replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) => (
      Object.hasOwn(values, name) ? String(values[name]) : match
    ));
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');

const TYPES = new Set(['architecture', 'workflow', 'sequence', 'dataflow', 'lifecycle']);

function usage() {
  return `${translateCliMessage('usage.heading')}
  archify render <type> <input.json> [output.html] [--quality standard|showcase] [--repo-root path (${translateCliMessage('usage.architecture-only')})]
  archify compare architecture <base.json> <head.json> [output.html] [--receipt path] [--json] [--quality standard|showcase] [--repo-root path]
  archify deliver <type> <input.json> [output.html] [--json] [--open] [--quality standard|showcase] [--repo-root path (${translateCliMessage('usage.architecture-only')})]
  archify preview <type> <input.json> [output.html] [--no-open] [--quality standard|showcase] [--repo-root path (${translateCliMessage('usage.architecture-only')})]
  archify validate <type> <input.json> [--json] [--layout-json] [--quality standard|showcase] [--repo-root path (${translateCliMessage('usage.architecture-only')})]
  archify migrate workflow <old.json> <new.json> --to-schema 2 [--json]
  archify inspect <type> <input.json>
  archify check <output.html>
  archify visual-check <output.html> [--json]
  archify guide [${translateCliMessage('usage.guide-argument')}] [--json] [--lang en|zh]
  archify brands [${translateCliMessage('usage.brands-query')}] [--json]
  archify brands capture <url> [--json]
  archify examples
  archify doctor
  archify demo [${translateCliMessage('usage.output-directory')}]

${translateCliMessage('usage.types')}
  architecture, workflow, sequence, dataflow, lifecycle
`;
}

function fail(message, code = 2) {
  console.error(message);
  process.exit(code);
}

function rendererPath(type) {
  if (!TYPES.has(type)) {
    fail(translateCliMessage('error.unknown-diagram-type', { type, types: [...TYPES].join(', ') }));
  }
  return path.join(skillRoot, 'renderers', type, `render-${type}.mjs`);
}

function runNode(args, options = {}) {
  return spawnSync(process.execPath, args, {
    cwd: options.cwd || process.cwd(),
    encoding: 'utf8',
    stdio: options.stdio || 'inherit',
    env: options.env ? { ...process.env, ...options.env } : process.env,
  });
}

function extractQualityArgs(args) {
  const rest = [];
  let quality;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--quality') {
      quality = args[index + 1];
      if (!quality || quality.startsWith('--')) fail(translateCliMessage('error.quality-required'));
      index += 1;
      continue;
    }
    if (arg.startsWith('--quality=')) {
      quality = arg.slice('--quality='.length);
      if (!quality) fail(translateCliMessage('error.quality-required'));
      continue;
    }
    rest.push(arg);
  }
  if (quality !== undefined && !['standard', 'showcase'].includes(quality)) {
    fail(translateCliMessage('error.unknown-quality', { quality }));
  }
  return { rest, quality };
}

function extractRepoRootArgs(args) {
  const rest = [];
  let repoRoot;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--repo-root') {
      repoRoot = args[index + 1];
      if (!repoRoot || repoRoot.startsWith('--')) fail(translateCliMessage('error.repo-root-required'));
      index += 1;
      continue;
    }
    if (arg.startsWith('--repo-root=')) {
      repoRoot = arg.slice('--repo-root='.length);
      if (!repoRoot) fail(translateCliMessage('error.repo-root-required'));
      continue;
    }
    rest.push(arg);
  }
  return { rest, repoRoot: repoRoot ? path.resolve(repoRoot) : undefined };
}

function rendererEnv(quality, repoRoot, diagnosticJson = false) {
  return {
    ...(quality ? { ARCHIFY_QUALITY_PROFILE: quality } : {}),
    ...(repoRoot ? { ARCHIFY_REPO_ROOT: repoRoot } : {}),
    ...(diagnosticJson ? { ARCHIFY_DIAGNOSTIC_FORMAT: 'json' } : {}),
  };
}

function diagnostic({ code, message, subject = {}, evidence = {}, supportedFixes = [], severity = 'error' }) {
  return {
    code,
    severity,
    message,
    subject,
    evidence,
    supportedFixes,
  };
}

function inputDiagnostic(error, inputPath) {
  const isSyntax = error instanceof SyntaxError;
  return diagnostic({
    code: isSyntax ? 'input/json-parse' : 'input/read',
    message: isSyntax
      ? translateCliMessage('input.json-parse.message', { reason: error.message })
      : translateCliMessage('input.read.message', { reason: error.message }),
    subject: { input: inputPath },
    evidence: {
      ...(error?.code ? { systemCode: error.code } : {}),
      reason: error.message,
    },
    supportedFixes: [isSyntax
      ? translateCliMessage('input.json-parse.fix')
      : translateCliMessage('input.read.fix')],
  });
}

function rendererFailure(result) {
  if (result.error) {
    return {
      error: translateCliMessage('runtime.renderer-process'),
      diagnostics: [diagnostic({
        code: 'internal/renderer-process',
        message: translateCliMessage('runtime.renderer-process'),
        evidence: { reason: result.error.message },
      })],
    };
  }
  try {
    const payload = JSON.parse((result.stderr || '').trim());
    if (payload?.ok === false && Array.isArray(payload.diagnostics) && payload.diagnostics.length) {
      const diagnostics = payload.diagnostics.map(localizeRendererDiagnostic);
      return {
        error: localizeRendererError(payload.error, diagnostics),
        diagnostics,
      };
    }
  } catch {
    // The diagnostic boundary is intentionally fail-closed. Never copy a raw
    // Node stack into a machine receipt when a renderer exits unexpectedly.
  }
  return {
    error: translateCliMessage('runtime.renderer-unclassified'),
    diagnostics: [diagnostic({
      code: 'internal/unclassified',
      message: translateCliMessage('runtime.renderer-unclassified'),
      evidence: { exitCode: result.status ?? 1 },
    })],
  };
}

function annotatedDiagnosticPath(diagnostic) {
  const pathValue = diagnostic.subject?.path || '/';
  return diagnostic.subject?.identity == null
    ? pathValue
    : `${pathValue} (id/label: ${JSON.stringify(diagnostic.subject.identity)})`;
}

function localizeRendererDiagnostic(diagnosticEntry) {
  const entry = {
    ...diagnosticEntry,
    subject: { ...(diagnosticEntry.subject || {}) },
    evidence: { ...(diagnosticEntry.evidence || {}) },
    supportedFixes: [...(diagnosticEntry.supportedFixes || [])],
  };
  if (entry.message === CLI_MESSAGE_SOURCES['runtime.unclassified-failure']) {
    entry.message = translateCliMessage('runtime.unclassified-failure');
  } else if (entry.code === 'input/json-parse') {
    entry.message = translateCliMessage('input.json-parse.message', {
      reason: entry.evidence.reason || entry.message,
    });
    entry.supportedFixes = [translateCliMessage('input.json-parse.fix')];
  } else if (entry.code === 'input/read') {
    entry.message = translateCliMessage('input.read.message', {
      reason: entry.evidence.reason || entry.message,
    });
    entry.supportedFixes = [translateCliMessage('input.read.fix')];
  } else if (entry.code === 'schema/additionalProperties') {
    const property = JSON.stringify(entry.evidence.additionalProperty);
    entry.message = translateCliMessage('schema.additional-properties.message', {
      path: annotatedDiagnosticPath(entry),
      details: JSON.stringify({ additionalProperty: entry.evidence.additionalProperty }),
    });
    entry.supportedFixes = [translateCliMessage('schema.additional-properties.fix', { property })];
  } else if (entry.code?.startsWith('schema/')) {
    const keyword = entry.code.slice('schema/'.length);
    const messageKey = {
      required: 'required',
      type: 'type',
      enum: 'enum',
      pattern: 'pattern',
      minimum: 'minimum',
      maximum: 'maximum',
      minItems: 'min-items',
      maxItems: 'max-items',
      minLength: 'min-length',
      maxLength: 'max-length',
    }[keyword];
    if (messageKey) {
      const params = Object.fromEntries(Object.entries(entry.evidence)
        .filter(([name]) => name !== 'keyword' && name !== 'expected'));
      const values = {
        path: annotatedDiagnosticPath(entry),
        details: Object.keys(params).length ? JSON.stringify(params) : '',
        property: JSON.stringify(entry.evidence.missingProperty),
        type: JSON.stringify(entry.evidence.type),
        values: JSON.stringify(entry.evidence.allowedValues || []),
        pattern: JSON.stringify(entry.evidence.pattern),
        comparison: entry.evidence.comparison,
        limit: entry.evidence.limit,
      };
      entry.message = translateCliMessage(`schema.${messageKey}.message`, values).trimEnd();
      entry.supportedFixes = [translateCliMessage(`schema.${messageKey}.fix`, values)];
    }
  }
  return entry;
}

function localizeRendererError(error, diagnostics) {
  const primary = diagnostics[0];
  if (primary?.code === 'input/json-parse' || primary?.code === 'input/read') return primary.message;
  if (primary?.code?.startsWith('schema/')) {
    const heading = translateCliMessage('schema.validation-failed', {
      type: primary.subject?.diagramType || 'diagram',
    });
    return `${heading}\n${diagnostics.map((entry) => `  ${entry.message}`).join('\n')}`;
  }
  return error || primary?.message;
}

const COMPOSITION_CHECKS = new Set([
  'label_route_clearance',
  'relationship_crossings',
  'relationship_corridors',
  'container_border_runs',
  'route_rhythm',
]);

const CHECK_FIXES = {
  single_svg: [translateCliMessage('fix.single-svg')],
  finite_svg: [translateCliMessage('fix.finite-svg')],
  orthogonal_arrows: [translateCliMessage('fix.orthogonal-arrows')],
  legend_clearance: [translateCliMessage('fix.legend-clearance')],
};

const COMPOSITION_FIXES = {
  'composition/proper-crossing': [translateCliMessage('fix.proper-crossing')],
  'composition/ambiguous-corridor': [translateCliMessage('fix.ambiguous-corridor')],
  'composition/container-border-run': [translateCliMessage('fix.container-border-run')],
  'composition/label-route-clearance': [translateCliMessage('fix.label-route-clearance')],
  'composition/desktop-readability': [translateCliMessage('fix.desktop-readability')],
  'composition/micro-segment': [translateCliMessage('fix.micro-segment')],
  'composition/short-interior-segment': [translateCliMessage('fix.short-interior-segment')],
};

function localizeCheckerDetail(check) {
  const detail = (check.details || []).find(Boolean);
  if (!detail) return null;
  if (check.name === 'single_svg') {
    const match = detail.match(/^found (\d+) <svg> block\(s\)$/);
    if (match) return translateCliMessage('checker.single-svg-detail', { count: match[1] });
  }
  if (check.name === 'orthogonal_arrows') {
    const match = detail.match(/^(\S+) (\d+) segment (\d+): ([\s\S]+)$/);
    if (match) {
      return translateCliMessage('checker.orthogonal-detail', {
        kind: match[1],
        index: match[2],
        segment: match[3],
        raw: match[4],
      });
    }
  }
  if (check.name === 'legend_clearance') {
    const match = detail.match(/^(\S+) (\d+) crosses legend ([\s\S]+)$/);
    if (match) {
      return translateCliMessage('checker.legend-detail', {
        kind: match[1],
        index: match[2],
        label: match[3],
      });
    }
  }
  return detail;
}

function checkerDiagnostics(checker) {
  const diagnostics = [];
  for (const issue of checker?.composition?.issues || []) {
    if (issue.severity !== 'error') continue;
    const { severity, code, relationship, ...evidence } = issue;
    diagnostics.push(diagnostic({
      code,
      severity,
      message: translateCliMessage('artifact.failed-code', { code }),
      subject: relationship ? { relationship } : { check: 'composition' },
      evidence,
      supportedFixes: COMPOSITION_FIXES[code] || [],
    }));
  }
  for (const check of checker?.checks || []) {
    if (check.ok || COMPOSITION_CHECKS.has(check.name)) continue;
    diagnostics.push(diagnostic({
      code: `artifact/${check.name.replaceAll('_', '-')}`,
      message: localizeCheckerDetail(check) || translateCliMessage('artifact.failed-check', { check: check.name }),
      subject: { check: check.name },
      evidence: { details: check.details || [] },
      supportedFixes: CHECK_FIXES[check.name] || [],
    }));
  }
  return diagnostics.length ? diagnostics : [diagnostic({
    code: 'artifact/check-failed',
    message: translateCliMessage('artifact.unclassified'),
    subject: { check: 'unknown' },
    evidence: {},
  })];
}

function formatDiagnostics(error, diagnostics = []) {
  if (!diagnostics.length) return error;
  return [
    error,
    ...diagnostics.map((entry) => {
      const fix = entry.supportedFixes?.length
        ? ` ${translateCliMessage('diagnostic.fix-label')} ${entry.supportedFixes.join('; ')}。`
        : '';
      return `[${entry.code}] ${entry.message}${fix}`;
    }),
  ].join('\n');
}

function assertEvidenceType(type, repoRoot) {
  if (repoRoot && type !== 'architecture') {
    fail(translateCliMessage('error.repo-root-architecture-only'));
  }
}

function exitFrom(result) {
  if (result.error) fail(result.error.message, 1);
  process.exit(result.status ?? 1);
}

function reportCompareFailure({ json, stage, error, code = 'delta/internal', details = {}, status = 1 }) {
  const receipt = {
    schemaVersion: 1,
    ok: false,
    command: 'compare',
    type: 'architecture',
    stage,
    error,
    diagnostics: [{
      code,
      severity: 'error',
      message: error,
      subject: details.side ? { side: details.side, ...(details.path ? { path: details.path } : {}) } : {},
      evidence: Object.fromEntries(Object.entries(details).filter(([key]) => !['side', 'path', 'supportedFixes'].includes(key))),
      supportedFixes: details.supportedFixes || [],
    }],
  };
  if (json) console.log(JSON.stringify(receipt, null, 2));
  else console.error(formatDiagnostics(error, receipt.diagnostics));
  process.exitCode = status;
}

function extractCompareOptions(args) {
  const positional = [];
  let receipt;
  let json = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--receipt') {
      receipt = args[index + 1];
      if (!receipt || receipt.startsWith('--')) fail(translateCliMessage('error.receipt-required'));
      index += 1;
      continue;
    }
    if (arg.startsWith('--receipt=')) {
      receipt = arg.slice('--receipt='.length);
      if (!receipt) fail(translateCliMessage('error.receipt-required'));
      continue;
    }
    if (arg.startsWith('--')) fail(translateCliMessage('error.unknown-option', { command: 'compare', option: arg }));
    positional.push(arg);
  }
  return { positional, receipt, json };
}

function compareReceiptPath(outputPath) {
  const extension = path.extname(outputPath);
  return extension ? `${outputPath.slice(0, -extension.length)}.receipt.json` : `${outputPath}.receipt.json`;
}

function compareCommitError(message, code, details = {}) {
  const error = new Error(message);
  error.compareStage = 'commit';
  error.compareCode = code;
  error.compareDetails = details;
  return error;
}

function commitComparePair({ htmlCandidate, receiptCandidate, outputPath, receiptPath, stagingDirectory }) {
  const targets = [
    { label: translateCliMessage('compare.target-html'), target: outputPath, candidate: htmlCandidate, backup: path.join(stagingDirectory, '.previous-output') },
    { label: translateCliMessage('compare.target-receipt'), target: receiptPath, candidate: receiptCandidate, backup: path.join(stagingDirectory, '.previous-receipt') },
  ];

  // Preflight the whole pair before moving either trusted target. This avoids
  // replacing the HTML and only then discovering that its receipt destination
  // cannot be committed (for example, because it is a directory).
  for (const item of targets) {
    if (!fs.existsSync(item.target)) continue;
    const existing = fs.lstatSync(item.target);
    if (!existing.isFile()) {
      throw compareCommitError(
        translateCliMessage('compare.commit-target', { label: item.label }),
        'delta/commit-target',
        {
          target: path.basename(item.target),
          targetType: existing.isDirectory() ? 'directory' : 'non-file',
          supportedFixes: [translateCliMessage('compare.fix.regular-file', { label: item.label })],
        },
      );
    }
  }

  const backedUp = [];
  const committed = [];
  try {
    for (const item of targets) {
      if (!fs.existsSync(item.target)) continue;
      fs.renameSync(item.target, item.backup);
      backedUp.push(item);
    }
    for (const item of targets) {
      fs.renameSync(item.candidate, item.target);
      committed.push(item);
    }
  } catch (cause) {
    const rollbackErrors = [];
    for (const item of [...committed].reverse()) {
      try {
        fs.rmSync(item.target, { force: true });
      } catch (error) {
        rollbackErrors.push(translateCliMessage('compare.rollback-remove', { label: item.label, reason: error.message }));
      }
    }
    for (const item of [...backedUp].reverse()) {
      try {
        if (fs.existsSync(item.target)) fs.rmSync(item.target, { force: true });
        fs.renameSync(item.backup, item.target);
      } catch (error) {
        rollbackErrors.push(translateCliMessage('compare.rollback-restore', { label: item.label, reason: error.message }));
      }
    }
    throw compareCommitError(
      rollbackErrors.length
        ? translateCliMessage('compare.commit-rollback-failed')
        : translateCliMessage('compare.commit-failed'),
      rollbackErrors.length ? 'delta/commit-rollback-failed' : 'delta/commit-failed',
      {
        reason: cause.message,
        ...(rollbackErrors.length ? { rollbackErrors } : {}),
        supportedFixes: [translateCliMessage('compare.fix.writable-pair')],
      },
    );
  }
}

function renderValidatedArchitecture(inputPath, outputPath, quality, repoRoot) {
  const render = runNode([rendererPath('architecture'), inputPath, outputPath], {
    stdio: 'pipe',
    env: rendererEnv(quality, repoRoot, true),
  });
  if (render.status !== 0) {
    const failure = rendererFailure(render);
    const error = new Error(failure.error);
    error.compareStage = 'input';
    error.compareStatus = render.status ?? 1;
    error.diagnostics = failure.diagnostics;
    throw error;
  }
  const check = runNode([path.join(skillRoot, 'scripts/check-render-output.mjs'), outputPath], { stdio: 'pipe' });
  if (check.status !== 0) {
    const error = new Error(translateCliMessage('compare.snapshot-check-failed'));
    error.compareStage = 'check';
    error.compareStatus = check.status ?? 1;
    try {
      error.checker = JSON.parse(check.stdout);
      error.diagnostics = checkerDiagnostics(error.checker);
    } catch {
      error.diagnostics = [];
    }
    throw error;
  }
  const artifact = fs.readFileSync(outputPath);
  return {
    artifact,
    html: artifact.toString('utf8'),
    checks: JSON.parse(check.stdout),
    sourceEvidence: sourceEvidenceFromArtifact(artifact),
  };
}

async function commandCompare(args) {
  const { resolveOutputPath } = await import('../renderers/shared/output-path.mjs');
  const qualityArgs = extractQualityArgs(args);
  const repoArgs = extractRepoRootArgs(qualityArgs.rest);
  const options = extractCompareOptions(repoArgs.rest);
  const [type, baseInput, headInput, requestedOutput] = options.positional;
  if (type !== 'architecture' || !baseInput || !headInput || options.positional.length > 4) fail(usage());
  let deltaRuntime;
  try {
    deltaRuntime = await import(pathToFileURL(path.join(skillRoot, 'delta/architecture-delta.mjs')).href);
  } catch (error) {
    reportCompareFailure({ json: options.json, stage: 'prepare', error: translateCliMessage('compare.runtime-unavailable'), code: 'delta/runtime-missing', details: { reason: error.message, supportedFixes: [translateCliMessage('compare.fix.install-package')] } });
    return;
  }
  const {
    ArchitectureDeltaError,
    annotateArchitectureSideSvg,
    buildDeltaSvg,
    canonicalArchitecture,
    canonicalArchitectureJson,
    compareArchitecture,
    extractArchitectureSvg,
    extractArtifactCss,
    renderArchitectureDeltaHtml,
    validateArchitectureDeltaHtml,
  } = deltaRuntime;

  const basePath = path.resolve(baseInput);
  const headPath = path.resolve(headInput);
  let outputPath;
  try {
    ({ outputPath } = resolveOutputPath({
      requestedOutput,
      defaultOutput: 'architecture-delta.html',
      inputPaths: [basePath, headPath],
    }));
  } catch (error) {
    const outputDiagnostic = error.archifyDiagnostics?.[0];
    reportCompareFailure({
      json: options.json,
      stage: 'prepare',
      error: error.message,
      code: outputDiagnostic?.code || 'output/path-resolution',
      details: {
        ...(outputDiagnostic?.subject || {}),
        ...(outputDiagnostic?.evidence || {}),
        supportedFixes: outputDiagnostic?.supportedFixes || [translateCliMessage('compare.fix.safe-output')],
      },
    });
    return;
  }
  let receiptPath;
  try {
    ({ outputPath: receiptPath } = resolveOutputPath({
      requestedOutput: options.receipt || compareReceiptPath(outputPath),
      defaultOutput: compareReceiptPath(outputPath),
      inputPaths: [basePath, headPath],
      otherOutputPaths: [outputPath],
    }));
  } catch (error) {
    const outputDiagnostic = error.archifyDiagnostics?.[0];
    reportCompareFailure({
      json: options.json,
      stage: 'prepare',
      error: error.message,
      code: outputDiagnostic?.code || 'output/path-resolution',
      details: {
        ...(outputDiagnostic?.subject || {}),
        ...(outputDiagnostic?.evidence || {}),
        supportedFixes: outputDiagnostic?.supportedFixes || [translateCliMessage('compare.fix.safe-receipt')],
      },
    });
    return;
  }
  let baseBuffer;
  let headBuffer;
  let base;
  let head;
  try {
    baseBuffer = fs.readFileSync(basePath);
    base = JSON.parse(baseBuffer.toString('utf8'));
  } catch (error) {
    reportCompareFailure({ json: options.json, stage: 'input', error: translateCliMessage('compare.read-base', { reason: error.message }), code: 'delta/base-input', details: { side: 'base', reason: error.message } });
    return;
  }
  try {
    headBuffer = fs.readFileSync(headPath);
    head = JSON.parse(headBuffer.toString('utf8'));
  } catch (error) {
    reportCompareFailure({ json: options.json, stage: 'input', error: translateCliMessage('compare.read-head', { reason: error.message }), code: 'delta/head-input', details: { side: 'head', reason: error.message } });
    return;
  }

  const outputDirectory = path.dirname(outputPath);
  if (path.dirname(receiptPath) !== outputDirectory) {
    reportCompareFailure({ json: options.json, stage: 'prepare', error: translateCliMessage('compare.receipt-directory'), code: 'delta/receipt-directory', details: { supportedFixes: [translateCliMessage('compare.fix.receipt-directory')] } });
    return;
  }
  try {
    fs.mkdirSync(outputDirectory, { recursive: true });
  } catch (error) {
    reportCompareFailure({ json: options.json, stage: 'prepare', error: translateCliMessage('compare.output-directory', { reason: error.message }), code: 'delta/output-directory', details: { reason: error.message } });
    return;
  }

  let stagingDirectory;
  try {
    stagingDirectory = fs.mkdtempSync(path.join(outputDirectory, '.archify-compare-'));
  } catch (error) {
    reportCompareFailure({ json: options.json, stage: 'prepare', error: translateCliMessage('compare.candidate-directory', { reason: error.message }), code: 'delta/candidate-directory', details: { reason: error.message } });
    return;
  }

  const baseCandidate = path.join(stagingDirectory, 'base.html');
  const headCandidate = path.join(stagingDirectory, 'head.html');
  const rawBaseCandidate = path.join(stagingDirectory, 'base.raw.html');
  const rawHeadCandidate = path.join(stagingDirectory, 'head.raw.html');
  const canonicalBaseInput = path.join(stagingDirectory, 'base.architecture.json');
  const canonicalHeadInput = path.join(stagingDirectory, 'head.architecture.json');
  const htmlCandidate = path.join(stagingDirectory, path.basename(outputPath));
  const receiptCandidate = path.join(stagingDirectory, path.basename(receiptPath));

  try {
    let baseResult;
    let headResult;
    try {
      renderValidatedArchitecture(basePath, rawBaseCandidate, qualityArgs.quality, repoArgs.repoRoot);
    } catch (error) {
      const diagnosticEntry = error.diagnostics?.[0];
      reportCompareFailure({
        json: options.json,
        stage: error.compareStage || 'validate',
        error: translateCliMessage('compare.base-validation', { reason: error.message }),
        code: diagnosticEntry?.code || 'delta/base-validation',
        details: { side: 'base', ...(diagnosticEntry?.subject?.path ? { path: diagnosticEntry.subject.path } : {}), ...(diagnosticEntry?.evidence || {}), supportedFixes: diagnosticEntry?.supportedFixes || [] },
        status: error.compareStatus || 1,
      });
      return;
    }
    try {
      renderValidatedArchitecture(headPath, rawHeadCandidate, qualityArgs.quality, repoArgs.repoRoot);
    } catch (error) {
      const diagnosticEntry = error.diagnostics?.[0];
      reportCompareFailure({
        json: options.json,
        stage: error.compareStage || 'validate',
        error: translateCliMessage('compare.head-validation', { reason: error.message }),
        code: diagnosticEntry?.code || 'delta/head-validation',
        details: { side: 'head', ...(diagnosticEntry?.subject?.path ? { path: diagnosticEntry.subject.path } : {}), ...(diagnosticEntry?.evidence || {}), supportedFixes: diagnosticEntry?.supportedFixes || [] },
        status: error.compareStatus || 1,
      });
      return;
    }

    // Validation must see the exact authored inputs. Only after both sides
    // pass do we canonicalize their collection order for deterministic SVG
    // geometry and stable artifact bytes.
    fs.writeFileSync(canonicalBaseInput, JSON.stringify(canonicalArchitecture(base)));
    fs.writeFileSync(canonicalHeadInput, JSON.stringify(canonicalArchitecture(head)));
    baseResult = renderValidatedArchitecture(canonicalBaseInput, baseCandidate, qualityArgs.quality, repoArgs.repoRoot);
    headResult = renderValidatedArchitecture(canonicalHeadInput, headCandidate, qualityArgs.quality, repoArgs.repoRoot);

    const semanticHash = (diagram) => createHash('sha256').update(canonicalArchitectureJson(diagram)).digest('hex');
    let compareIr;
    try {
      compareIr = compareArchitecture(base, head, {
        baseRawSha256: createHash('sha256').update(baseBuffer).digest('hex'),
        headRawSha256: createHash('sha256').update(headBuffer).digest('hex'),
        baseSemanticSha256: semanticHash(base),
        headSemanticSha256: semanticHash(head),
        baseBytes: baseBuffer.byteLength,
        headBytes: headBuffer.byteLength,
        baseVerified: Boolean(baseResult.sourceEvidence),
        headVerified: Boolean(headResult.sourceEvidence),
      });
    } catch (error) {
      if (!(error instanceof ArchitectureDeltaError)) throw error;
      reportCompareFailure({ json: options.json, stage: 'compare', error: error.message, code: error.code, details: error.details });
      return;
    }

    const baseSourceSvg = extractArchitectureSvg(baseResult.html);
    const headSourceSvg = extractArchitectureSvg(headResult.html);
    const baseSvg = annotateArchitectureSideSvg(baseSourceSvg, compareIr, 'base');
    const headSvg = annotateArchitectureSideSvg(headSourceSvg, compareIr, 'head');
    const deltaSvg = buildDeltaSvg(baseSourceSvg, headSourceSvg, compareIr);
    // Raw input hashes and byte counts belong in the sidecar receipt, not the
    // artifact. Keeping them out makes formatting-only input rewrites produce
    // the exact same canonical review HTML and artifact hash.
    const artifactIr = {
      ...compareIr,
      base: Object.fromEntries(Object.entries(compareIr.base).filter(([key]) => !['rawSha256', 'bytes'].includes(key))),
      head: Object.fromEntries(Object.entries(compareIr.head).filter(([key]) => !['rawSha256', 'bytes'].includes(key))),
    };
    const html = renderArchitectureDeltaHtml({
      receipt: artifactIr,
      baseSvg,
      deltaSvg,
      headSvg,
      baseHtml: baseResult.html,
      headHtml: headResult.html,
      artifactCss: extractArtifactCss(headResult.html),
    });
    const deltaValidation = validateArchitectureDeltaHtml(html, artifactIr);
    fs.writeFileSync(htmlCandidate, html);
    const artifact = fs.readFileSync(htmlCandidate);
    const baseChecks = baseResult.checks.checks.filter((check) => check.ok).length;
    const headChecks = headResult.checks.checks.filter((check) => check.ok).length;
    const finalReceipt = {
      ...compareIr,
      artifact: { sha256: createHash('sha256').update(artifact).digest('hex'), bytes: artifact.byteLength },
      validation: {
        checksPassed: baseChecks + headChecks + deltaValidation.checksPassed,
        checkCount: baseResult.checks.checks.length + headResult.checks.checks.length + deltaValidation.checkCount,
        baseComposition: baseResult.checks.composition.status,
        headComposition: headResult.checks.composition.status,
      },
    };
    fs.writeFileSync(receiptCandidate, `${JSON.stringify(finalReceipt, null, 2)}\n`);

    try {
      const currentOutput = resolveOutputPath({
        requestedOutput,
        defaultOutput: 'architecture-delta.html',
        inputPaths: [basePath, headPath],
      }).outputPath;
      resolveOutputPath({
        requestedOutput: options.receipt || compareReceiptPath(currentOutput),
        defaultOutput: compareReceiptPath(currentOutput),
        inputPaths: [basePath, headPath],
        otherOutputPaths: [currentOutput],
      });
    } catch (error) {
      const outputDiagnostic = error.archifyDiagnostics?.[0];
      reportCompareFailure({
        json: options.json,
        stage: 'commit',
        error: error.message,
        code: outputDiagnostic?.code || 'output/path-resolution',
        details: {
          ...(outputDiagnostic?.subject || {}),
          ...(outputDiagnostic?.evidence || {}),
          supportedFixes: outputDiagnostic?.supportedFixes || [translateCliMessage('compare.fix.restore-paths')],
        },
      });
      return;
    }

    commitComparePair({ htmlCandidate, receiptCandidate, outputPath, receiptPath, stagingDirectory });
    if (options.json) console.log(JSON.stringify(finalReceipt, null, 2));
    else {
      console.log(translateCliMessage('compare.success', { output: outputPath }));
      console.log(translateCliMessage('compare.summary', { passed: finalReceipt.validation.checksPassed, count: finalReceipt.validation.checkCount, completeness: finalReceipt.completeness, proofLevel: finalReceipt.proofLevel, sha256: finalReceipt.artifact.sha256.slice(0, 12) }));
      console.log(translateCliMessage('common.receipt', { path: receiptPath }));
    }
  } catch (error) {
    if (error instanceof ArchitectureDeltaError) {
      reportCompareFailure({ json: options.json, stage: 'artifact', error: error.message, code: error.code, details: error.details });
    } else if (error.compareStage === 'commit') {
      reportCompareFailure({
        json: options.json,
        stage: error.compareStage,
        error: error.message,
        code: error.compareCode,
        details: error.compareDetails,
      });
    } else {
      reportCompareFailure({ json: options.json, stage: 'internal', error: translateCliMessage('compare.internal'), code: 'delta/internal', details: { reason: error.message } });
    }
  } finally {
    try {
      fs.rmSync(stagingDirectory, { recursive: true, force: true });
    } catch (error) {
      console.error(translateCliMessage('compare.cleanup-warning', { reason: error.message }));
    }
  }
}

function commandRender(args) {
  const qualityArgs = extractQualityArgs(args);
  const repoArgs = extractRepoRootArgs(qualityArgs.rest);
  const [type, input, output] = repoArgs.rest;
  if (!type || !input) fail(usage());
  assertEvidenceType(type, repoArgs.repoRoot);
  const result = runNode([rendererPath(type), input, ...(output ? [output] : [])], {
    env: rendererEnv(qualityArgs.quality, repoArgs.repoRoot),
  });
  if (result.status !== 0) exitFrom(result);
}

function reportArtifactFailure({ command, json, stage, type, input, output, error, diagnostics = [], status = 1, checker }) {
  const receipt = {
    schemaVersion: 1,
    ok: false,
    command,
    stage,
    type,
    input,
    ...(output === undefined ? {} : { output }),
    error,
    diagnostics,
    ...(checker ? { checker } : {}),
  };
  if (json) console.log(JSON.stringify(receipt, null, 2));
  else console.error(formatDiagnostics(error, diagnostics));
  process.exitCode = status;
}

function reportDeliveryFailure(options) {
  reportArtifactFailure({ ...options, command: 'deliver' });
}

function reportValidateFailure(options) {
  reportArtifactFailure({ ...options, command: 'validate' });
}

function sourceEvidenceFromArtifact(artifact) {
  const html = artifact.toString('utf8');
  const match = html.match(/<script id="archify-source-evidence-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return null;
  const evidence = JSON.parse(match[1]);
  if (evidence?.verified !== true || !evidence.repository?.revision || !Number.isInteger(evidence.referenceCount)) {
    throw new Error(translateCliMessage('delivery.evidence-incomplete'));
  }
  return evidence;
}

function engineeringProfileFromArtifact(artifact) {
  const match = artifact.toString('utf8').match(/<svg[^>]*\sdata-engineering-profile="([^"]+)"/);
  return match ? match[1] : null;
}

async function commandDeliver(args) {
  const { resolveOutputPath } = await import('../renderers/shared/output-path.mjs');
  const qualityArgs = extractQualityArgs(args);
  const repoArgs = extractRepoRootArgs(qualityArgs.rest);
  const json = repoArgs.rest.includes('--json');
  const open = repoArgs.rest.includes('--open');
  const knownOptions = new Set(['--json', '--open']);
  const unknown = repoArgs.rest.filter((arg) => arg.startsWith('--') && !knownOptions.has(arg));
  if (unknown.length) fail(translateCliMessage('error.unknown-option', { command: 'deliver', option: unknown[0] }));
  const positional = repoArgs.rest.filter((arg) => !knownOptions.has(arg));
  const [type, input, requestedOutput] = positional;
  if (!type || !input || positional.length > 3) fail(usage());
  assertEvidenceType(type, repoArgs.repoRoot);

  const renderer = rendererPath(type);
  const inputPath = path.resolve(input);
  let specification;
  let diagram;
  try {
    specification = fs.readFileSync(inputPath);
    diagram = JSON.parse(specification.toString('utf8'));
  } catch (error) {
    const repair = inputDiagnostic(error, inputPath);
    reportDeliveryFailure({
      json,
      stage: 'input',
      type,
      input: inputPath,
      output: path.resolve(requestedOutput || `${type}.html`),
      error: translateCliMessage('delivery.read-input', { input: inputPath, reason: error.message }),
      diagnostics: [repair],
    });
    return;
  }

  const authoredOutput = typeof diagram?.meta?.output === 'string' && diagram.meta.output
    ? diagram.meta.output
    : undefined;
  let outputPath;
  try {
    ({ outputPath } = resolveOutputPath({
      requestedOutput,
      authoredOutput,
      defaultOutput: `${type}.html`,
      inputPaths: [inputPath],
    }));
  } catch (error) {
    const attemptedOutput = path.resolve(requestedOutput || authoredOutput || `${type}.html`);
    reportDeliveryFailure({
      json,
      stage: 'prepare',
      type,
      input: inputPath,
      output: attemptedOutput,
      error: error.message,
      diagnostics: error.archifyDiagnostics || [diagnostic({
        code: 'output/path-resolution',
        message: error.message,
        subject: { output: attemptedOutput },
        evidence: { ...(error?.code ? { systemCode: error.code } : {}) },
        supportedFixes: [translateCliMessage('compare.fix.safe-output')],
      })],
    });
    return;
  }
  const outputDirectory = path.dirname(outputPath);
  try {
    fs.mkdirSync(outputDirectory, { recursive: true });
  } catch (error) {
    const message = translateCliMessage('delivery.prepare-directory', { directory: outputDirectory, reason: error.message });
    reportDeliveryFailure({
      json,
      stage: 'prepare',
      type,
      input: inputPath,
      output: outputPath,
      error: message,
      diagnostics: [diagnostic({
        code: 'delivery/prepare-directory',
        message,
        subject: { outputDirectory },
        evidence: { ...(error?.code ? { systemCode: error.code } : {}), reason: error.message },
        supportedFixes: [translateCliMessage('delivery.fix.writable-directory')],
      })],
    });
    return;
  }

  // Keep the candidate beside the target so the final rename is one
  // same-filesystem commit. A render or artifact-check failure never touches
  // an existing trusted output.
  let stagingDirectory;
  try {
    stagingDirectory = fs.mkdtempSync(path.join(outputDirectory, '.archify-delivery-'));
  } catch (error) {
    const message = translateCliMessage('delivery.prepare-candidate', { output: outputPath, reason: error.message });
    reportDeliveryFailure({
      json,
      stage: 'prepare',
      type,
      input: inputPath,
      output: outputPath,
      error: message,
      diagnostics: [diagnostic({
        code: 'delivery/prepare-candidate',
        message,
        subject: { output: outputPath },
        evidence: { ...(error?.code ? { systemCode: error.code } : {}), reason: error.message },
        supportedFixes: [translateCliMessage('delivery.fix.writable-target-filesystem')],
      })],
    });
    return;
  }
  const candidatePath = path.join(stagingDirectory, path.basename(outputPath));
  const specificationSnapshotPath = path.join(stagingDirectory, 'specification.snapshot.json');

  try {
    try {
      fs.writeFileSync(specificationSnapshotPath, specification, { flag: 'wx' });
    } catch (error) {
      const message = translateCliMessage('delivery.freeze-specification', { reason: error.message });
      reportDeliveryFailure({
        json,
        stage: 'prepare',
        type,
        input: inputPath,
        output: outputPath,
        error: message,
        diagnostics: [diagnostic({
          code: 'delivery/freeze-specification',
          message,
          subject: { input: inputPath },
          evidence: { ...(error?.code ? { systemCode: error.code } : {}), reason: error.message },
          supportedFixes: [translateCliMessage('delivery.fix.writable-target-filesystem')],
        })],
      });
      return;
    }

    const render = runNode([renderer, specificationSnapshotPath, candidatePath], {
      stdio: 'pipe',
      env: rendererEnv(qualityArgs.quality, repoArgs.repoRoot, true),
    });
    if (render.status !== 0) {
      const failure = rendererFailure(render);
      reportDeliveryFailure({
        json,
        stage: 'render',
        type,
        input: inputPath,
        output: outputPath,
        error: failure.error,
        diagnostics: failure.diagnostics,
        status: render.status ?? 1,
      });
      return;
    }

    const check = runNode([path.join(skillRoot, 'scripts/check-render-output.mjs'), candidatePath], {
      stdio: 'pipe',
    });
    if (check.status !== 0) {
      if (check.stderr) process.stderr.write(check.stderr);
      let checker;
      try {
        checker = JSON.parse(check.stdout);
        checker.file = outputPath;
      } catch {
        checker = { ok: false, file: outputPath, diagnostic: check.stdout.trim() };
      }
      reportDeliveryFailure({
        json,
        stage: 'check',
        type,
        input: inputPath,
        output: outputPath,
        error: translateCliMessage('delivery.artifact-preserved'),
        diagnostics: checkerDiagnostics(checker),
        status: check.status ?? 1,
        checker,
      });
      return;
    }

    let result;
    try {
      result = JSON.parse(check.stdout);
    } catch (error) {
      const message = translateCliMessage('delivery.receipt-invalid', { reason: error.message });
      reportDeliveryFailure({
        json,
        stage: 'receipt',
        type,
        input: inputPath,
        output: outputPath,
        error: message,
        diagnostics: [diagnostic({
          code: 'delivery/receipt-invalid',
          message,
          subject: { output: outputPath },
          evidence: { reason: error.message },
        })],
      });
      return;
    }
    let artifact;
    try {
      artifact = fs.readFileSync(candidatePath);
    } catch (error) {
      const message = translateCliMessage('delivery.candidate-unreadable', { reason: error.message });
      reportDeliveryFailure({
        json,
        stage: 'receipt',
        type,
        input: inputPath,
        output: outputPath,
        error: message,
        diagnostics: [diagnostic({
          code: 'delivery/candidate-unreadable',
          message,
          subject: { output: outputPath },
          evidence: { ...(error?.code ? { systemCode: error.code } : {}), reason: error.message },
        })],
      });
      return;
    }
    let sourceEvidence;
    try {
      sourceEvidence = sourceEvidenceFromArtifact(artifact);
    } catch (error) {
      const message = translateCliMessage('delivery.evidence-invalid', { reason: error.message });
      reportDeliveryFailure({
        json,
        stage: 'receipt',
        type,
        input: inputPath,
        output: outputPath,
        error: message,
        diagnostics: [diagnostic({
          code: 'delivery/evidence-receipt-invalid',
          message,
          subject: { output: outputPath },
          evidence: { reason: error.message },
        })],
      });
      return;
    }
    const engineeringProfile = engineeringProfileFromArtifact(artifact);
    const receipt = {
      schemaVersion: 1,
      ok: true,
      command: 'deliver',
      type,
      input: inputPath,
      output: outputPath,
      specification: {
        sha256: createHash('sha256').update(specification).digest('hex'),
        bytes: specification.byteLength,
      },
      artifact: {
        sha256: createHash('sha256').update(artifact).digest('hex'),
        bytes: artifact.byteLength,
      },
      validation: {
        checksPassed: result.checks.filter((checkItem) => checkItem.ok).length,
        checkCount: result.checks.length,
        compositionProfile: result.composition.profile,
        compositionStatus: result.composition.status,
        ...(engineeringProfile ? { engineeringProfile } : {}),
        errors: result.composition.summary.errors,
        warnings: result.composition.summary.warnings,
      },
      ...(sourceEvidence ? {
        evidence: {
          verified: true,
          // Verification is always local. "scope" says whether the verified
          // paths also resolve to public permalinks.
          scope: sourceEvidence.repository.url ? 'public-permalink' : 'local',
          ...(sourceEvidence.repository.url ? { repository: sourceEvidence.repository.url } : {}),
          revision: sourceEvidence.repository.revision,
          references: sourceEvidence.referenceCount,
        },
      } : {}),
    };

    try {
      resolveOutputPath({
        requestedOutput,
        authoredOutput,
        defaultOutput: `${type}.html`,
        inputPaths: [inputPath],
      });
    } catch (error) {
      reportDeliveryFailure({
        json,
        stage: 'commit',
        type,
        input: inputPath,
        output: outputPath,
        error: error.message,
        diagnostics: error.archifyDiagnostics || [diagnostic({
          code: 'output/path-resolution',
          message: error.message,
          subject: { output: outputPath },
          evidence: { ...(error?.code ? { systemCode: error.code } : {}) },
          supportedFixes: [translateCliMessage('compare.fix.restore-paths')],
        })],
      });
      return;
    }

    try {
      fs.renameSync(candidatePath, outputPath);
    } catch (error) {
      const message = translateCliMessage('delivery.commit', { output: outputPath, reason: error.message });
      reportDeliveryFailure({
        json,
        stage: 'commit',
        type,
        input: inputPath,
        output: outputPath,
        error: message,
        diagnostics: [diagnostic({
          code: 'delivery/commit',
          message,
          subject: { output: outputPath },
          evidence: { ...(error?.code ? { systemCode: error.code } : {}), reason: error.message },
          supportedFixes: [translateCliMessage('delivery.fix.replaceable-target')],
        })],
      });
      return;
    }

    if (open) {
      try {
        const { openArtifact } = await import('./open-artifact.mjs');
        receipt.open = openArtifact(outputPath);
      } catch {
        receipt.open = {
          requested: true,
          status: 'unsupported',
          target: outputPath,
          method: null,
        };
      }
      if (receipt.open.status !== 'opened') {
        console.error(translateCliMessage('delivery.open-failed', { status: receipt.open.status, output: outputPath }));
      }
    }

    if (json) {
      console.log(JSON.stringify(receipt, null, 2));
    } else {
      console.log(translateCliMessage('delivery.success', { type, output: outputPath }));
      const engineering = receipt.validation.engineeringProfile
        ? translateCliMessage('delivery.engineering-pass', { profile: receipt.validation.engineeringProfile })
        : '';
      console.log(translateCliMessage('delivery.summary', { passed: receipt.validation.checksPassed, count: receipt.validation.checkCount, profile: receipt.validation.compositionProfile, status: receipt.validation.compositionStatus, engineering, sha256: receipt.artifact.sha256.slice(0, 12) }));
      if (receipt.open?.status === 'opened') console.log(translateCliMessage('delivery.opened', { output: outputPath }));
    }
  } finally {
    try {
      fs.rmSync(stagingDirectory, { recursive: true, force: true });
    } catch (error) {
      console.error(translateCliMessage('delivery.cleanup-warning', { directory: stagingDirectory, reason: error.message }));
    }
  }
}

async function commandPreview(args) {
  const qualityArgs = extractQualityArgs(args);
  const repoArgs = extractRepoRootArgs(qualityArgs.rest);
  const noOpen = repoArgs.rest.includes('--no-open');
  const knownOptions = new Set(['--no-open']);
  const unknown = repoArgs.rest.filter((arg) => arg.startsWith('--') && !knownOptions.has(arg));
  if (unknown.length) fail(translateCliMessage('error.unknown-option', { command: 'preview', option: unknown[0] }));
  const positional = repoArgs.rest.filter((arg) => !knownOptions.has(arg));
  const [type, input, output] = positional;
  if (!type || !input || positional.length > 3) fail(usage());
  assertEvidenceType(type, repoArgs.repoRoot);
  rendererPath(type);

  let runPreview;
  try {
    ({ runPreview } = await import('./preview.mjs'));
  } catch (error) {
    fail(translateCliMessage('preview.load-failed', { reason: error.message }), 1);
  }
  try {
    await runPreview({
      type,
      input,
      output,
      quality: qualityArgs.quality,
      repoRoot: repoArgs.repoRoot,
      open: !noOpen,
    });
  } catch (error) {
    fail(translateCliMessage('preview.start-failed', { reason: error.message }), 1);
  }
}

function commandCheck(args) {
  const [html] = args;
  if (!html) fail(usage());
  const result = runNode([path.join(skillRoot, 'scripts/check-render-output.mjs'), html]);
  if (result.status !== 0) exitFrom(result);
}

async function commandVisualCheck(args) {
  const json = args.includes('--json');
  const knownOptions = new Set(['--json']);
  const unknown = args.filter((arg) => arg.startsWith('--') && !knownOptions.has(arg));
  if (unknown.length) fail(translateCliMessage('error.unknown-option', { command: 'visual-check', option: unknown[0] }), 1);
  const positional = args.filter((arg) => !knownOptions.has(arg));
  if (positional.length !== 1) fail(usage(), 1);

  let runVisualCheck;
  try {
    ({ runVisualCheck } = await import('./visual-check.mjs'));
  } catch (error) {
    fail(translateCliMessage('visual-check.load-failed', { reason: error.message }), 1);
  }

  let result;
  try {
    result = await runVisualCheck({ artifactPath: positional[0] });
  } catch (error) {
    if (json) {
      console.log(JSON.stringify({
        schemaVersion: 1,
        ok: false,
        command: 'visual-check',
        status: 'fail',
        visualReview: 'pending',
        artifact: { path: path.resolve(positional[0]) },
        error: error.message,
      }, null, 2));
    } else {
      console.error(translateCliMessage('visual-check.failed', { reason: error.message }));
    }
    process.exitCode = 1;
    return;
  }

  if (json) {
    console.log(JSON.stringify(result.receipt, null, 2));
  } else {
    console.log(translateCliMessage('visual-check.success', { status: result.receipt.status, path: result.receipt.artifact.path }));
    console.log(translateCliMessage('visual-check.summary', { containment: result.receipt.containment.status, captures: result.receipt.captures.status }));
    console.log(translateCliMessage('common.receipt', { path: path.join(path.dirname(result.receipt.artifact.path), result.receipt.sidecars.receipt) }));
    if (result.receipt.captures.contactSheet) {
      console.log(translateCliMessage('visual-check.contact-sheet', { path: path.join(path.dirname(result.receipt.artifact.path), result.receipt.captures.contactSheet) }));
    }
    if (result.receipt.error) console.error(result.receipt.error);
  }
  process.exitCode = result.exitCode;
}

function commandExamples() {
  const result = runNode([path.join(skillRoot, 'scripts/render-examples.mjs')], { cwd: skillRoot });
  if (result.status !== 0) exitFrom(result);
}

async function commandDoctor() {
  const checks = [];
  const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10);
  checks.push({
    label: translateCliMessage('doctor.node', { version: process.versions.node }),
    ok: nodeMajor >= 18,
    missing: 0,
    failureLabel: 'unsupported',
  });

  const template = path.join(skillRoot, 'assets/template.html');
  checks.push({
    label: translateCliMessage('doctor.core-template'),
    ok: fs.existsSync(template),
    missing: fs.existsSync(template) ? 0 : 1,
  });

  const examplesRenderer = path.join(skillRoot, 'scripts/render-examples.mjs');
  checks.push({
    label: translateCliMessage('doctor.example-renderer'),
    ok: fs.existsSync(examplesRenderer),
    missing: fs.existsSync(examplesRenderer) ? 0 : 1,
  });

  const previewRuntime = path.join(skillRoot, 'bin/preview.mjs');
  checks.push({
    label: translateCliMessage('doctor.preview-runtime'),
    ok: fs.existsSync(previewRuntime),
    missing: fs.existsSync(previewRuntime) ? 0 : 1,
  });

  const visualCheckRuntime = path.join(skillRoot, 'bin/visual-check.mjs');
  checks.push({
    label: translateCliMessage('doctor.visual-check-runtime'),
    ok: fs.existsSync(visualCheckRuntime),
    missing: fs.existsSync(visualCheckRuntime) ? 0 : 1,
  });

  const outputPathRuntime = path.join(skillRoot, 'renderers/shared/output-path.mjs');
  checks.push({
    label: translateCliMessage('doctor.output-path-runtime'),
    ok: fs.existsSync(outputPathRuntime),
    missing: fs.existsSync(outputPathRuntime) ? 0 : 1,
  });

  const scenarioGuide = path.join(skillRoot, 'recipes/scenarios.mjs');
  checks.push({
    label: translateCliMessage('doctor.scenario-guide'),
    ok: fs.existsSync(scenarioGuide),
    missing: fs.existsSync(scenarioGuide) ? 0 : 1,
  });

  const authoringReferences = [
    path.join(skillRoot, 'references', 'authoring-contract.md'),
    path.join(skillRoot, 'references', 'viewer-runtime.md'),
    path.join(skillRoot, 'references', 'delivery-contract.md'),
  ];
  const authoringReferencesMissing = authoringReferences.filter((file) => !fs.existsSync(file)).length;
  checks.push({
    label: translateCliMessage('doctor.authoring-references'),
    ok: authoringReferencesMissing === 0,
    missing: authoringReferencesMissing,
  });

  const compareRuntime = path.join(skillRoot, 'delta/architecture-delta.mjs');
  const compareFixtures = [
    path.join(skillRoot, 'examples/checkout-platform.base.architecture.json'),
    path.join(skillRoot, 'examples/checkout-platform.head.architecture.json'),
  ];
  const compareMissing = [compareRuntime, ...compareFixtures].filter((file) => !fs.existsSync(file)).length;
  checks.push({
    label: translateCliMessage('doctor.compare-runtime'),
    ok: compareMissing === 0,
    missing: compareMissing,
  });

  const validators = path.join(skillRoot, 'renderers/shared/generated-validators.mjs');
  const validatorsExist = fs.existsSync(validators);
  let validatorsValid = false;
  if (validatorsExist) {
    try {
      const module = await import(`${pathToFileURL(validators).href}?doctor=${Date.now()}`);
      validatorsValid = [...TYPES].every((type) => typeof module[type] === 'function');
    } catch {
      validatorsValid = false;
    }
  }
  checks.push({
    label: translateCliMessage('doctor.validators'),
    ok: validatorsValid,
    missing: validatorsExist ? 0 : 1,
    invalid: validatorsExist && !validatorsValid ? 1 : 0,
    failureLabel: validatorsExist ? 'invalid' : 'missing',
  });

  const examples = {
    architecture: 'web-app.architecture.json',
    workflow: 'agent-tool-call.workflow.json',
    sequence: 'cache-miss-request.sequence.json',
    dataflow: 'product-analytics.dataflow.json',
    lifecycle: 'agent-run.lifecycle.json',
  };

  for (const type of TYPES) {
    const required = [
      path.join(skillRoot, 'renderers', type, `render-${type}.mjs`),
      path.join(skillRoot, 'schemas', `${type}.schema.json`),
      path.join(skillRoot, 'examples', examples[type]),
    ];
    const missing = required.filter((file) => !fs.existsSync(file)).length;
    checks.push({
      label: translateCliMessage('doctor.renderer-bundle', { type }),
      ok: missing === 0,
      missing,
    });
  }

  console.log(`${translateCliMessage('doctor.heading')}\n`);
  for (const check of checks) {
    console.log(`[${check.ok ? 'ok' : (check.failureLabel || 'missing')}] ${check.label}`);
  }

  const nodeFailed = checks[0].ok ? 0 : 1;
  const missingFiles = checks.reduce((count, check) => count + check.missing, 0);
  const invalidRuntime = checks.reduce((count, check) => count + (check.invalid || 0), 0);
  if (nodeFailed === 0 && missingFiles === 0 && invalidRuntime === 0) {
    console.log(`\n${translateCliMessage('doctor.ready')}`);
    return;
  }

  const problems = [];
  if (nodeFailed) problems.push(translateCliMessage('doctor.node-required'));
  if (missingFiles) problems.push(translateCliMessage(`doctor.file-missing.${missingFiles === 1 ? 'one' : 'other'}`, { count: missingFiles }));
  if (invalidRuntime) problems.push(translateCliMessage(`doctor.runtime-failed.${invalidRuntime === 1 ? 'one' : 'other'}`, { count: invalidRuntime }));
  console.error(`\n${translateCliMessage('doctor.not-ready', { problems: problems.join('、') })}`);
  process.exitCode = 1;
}

async function commandGuide(args) {
  let lang;
  let json = false;
  const queryParts = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') {
      json = true;
    } else if (arg === '--lang') {
      const value = args[index + 1];
      if (value !== 'en' && value !== 'zh') fail(translateCliMessage('error.lang-values'));
      lang = value;
      index += 1;
    } else if (arg.startsWith('--lang=')) {
      const value = arg.slice('--lang='.length);
      if (value !== 'en' && value !== 'zh') fail(translateCliMessage('error.lang-values'));
      lang = value;
    } else if (arg.startsWith('--')) {
      fail(translateCliMessage('error.unknown-option', { command: 'guide', option: arg }));
    } else {
      queryParts.push(arg);
    }
  }

  const guidePath = path.join(skillRoot, 'recipes/scenarios.mjs');
  let guide;
  try {
    guide = await import(pathToFileURL(guidePath).href);
  } catch (error) {
    fail(translateCliMessage('guide.load-failed', { reason: error.message }), 1);
  }

  const query = queryParts.join(' ').trim();
  if (!query) {
    const selectedLang = lang || 'en';
    if (json) {
      console.log(JSON.stringify({
        ok: true,
        mode: 'list',
        lang: selectedLang,
        recipes: guide.listScenarioRecipes(selectedLang),
      }, null, 2));
    } else {
      console.log(guide.formatScenarioList(selectedLang));
    }
    return;
  }

  const result = guide.recommendScenario(query, lang ? { lang } : {});
  console.log(json ? JSON.stringify(result, null, 2) : guide.formatScenarioRecommendation(result));
}

async function commandBrands(args) {
  const json = args.includes('--json');
  const unknown = args.filter((arg) => arg.startsWith('--') && arg !== '--json');
  if (unknown.length) fail(translateCliMessage('error.unknown-option', { command: 'brands', option: unknown[0] }));
  const positional = args.filter((arg) => arg !== '--json');
  if (positional[0] === 'capture') {
    if (positional.length !== 2) fail(translateCliMessage('usage.brands-capture'));
    const { captureBrandReference } = await import('../renderers/shared/brand-marks.mjs');
    let capture;
    try {
      capture = await captureBrandReference(positional[1]);
    } catch (error) {
      fail(localizeBrandCaptureError(error.message));
    }
    const result = {
      schemaVersion: 1,
      ok: true,
      command: 'brands capture',
      brand: capture.brand,
      evidence: {
        status: capture.resolved.status,
        source: capture.resolved.sourceUrl,
        ...(capture.resolved.sha256 ? { sha256: capture.resolved.sha256 } : {}),
        ...(capture.resolved.contentType ? { contentType: capture.resolved.contentType } : {}),
      },
    };
    console.log(json ? JSON.stringify(result, null, 2) : JSON.stringify(result.brand));
    return;
  }
  const query = positional.join(' ').trim();
  const { listBrandMarks } = await import('../renderers/shared/brand-marks.mjs');
  const marks = listBrandMarks(query);
  if (json) {
    console.log(JSON.stringify({
      schemaVersion: 1,
      ok: true,
      command: 'brands',
      query,
      count: marks.length,
      marks,
      fallback: translateCliMessage('brands.capture-fallback'),
    }, null, 2));
    return;
  }
  if (!marks.length) {
    console.log(translateCliMessage('brands.no-match', { query }));
    return;
  }
  const grouped = Map.groupBy
    ? Map.groupBy(marks, (mark) => mark.category)
    : marks.reduce((map, mark) => map.set(mark.category, [...(map.get(mark.category) || []), mark]), new Map());
  for (const [category, entries] of grouped) {
    console.log(`${category}: ${entries.map((mark) => mark.id).join(', ')}`);
  }
}

function commandDemo(args) {
  if (args.length > 1) fail(usage());

  const outputDirectory = path.resolve(args[0] || process.cwd());
  const output = path.join(outputDirectory, 'archify-demo.html');
  const input = path.join(skillRoot, 'examples/web-app.architecture.json');

  try {
    fs.mkdirSync(outputDirectory, { recursive: true });
  } catch (error) {
    fail(translateCliMessage('demo.create-directory', { directory: outputDirectory, reason: error.message }), 1);
  }

  const result = runNode([rendererPath('architecture'), input, output]);
  if (result.status !== 0) exitFrom(result);

  console.log(`\n${translateCliMessage('demo.ready', { output })}`);
  console.log(translateCliMessage('demo.next'));
  console.log('  archify render architecture <input.json> <output.html>');
}

function migrationPathDiagnostics(error, sourcePath, destinationPath) {
  if (Array.isArray(error?.archifyDiagnostics) && error.archifyDiagnostics.length) {
    return error.archifyDiagnostics.map((entry) => ({
      ...entry,
      subject: { ...(entry.subject || {}) },
      evidence: { ...(entry.evidence || {}) },
      supportedFixes: [...(entry.supportedFixes || [])],
    }));
  }
  return [diagnostic({
    code: 'migration/path-preflight',
    message: translateCliMessage('migration.path-preflight'),
    subject: { source: sourcePath, destination: destinationPath },
    evidence: {
      ...(error?.code ? { systemCode: error.code } : {}),
      reason: error?.message || String(error),
    },
    supportedFixes: [translateCliMessage('migration.fix.path-preflight')],
  })];
}

function migrationReport({
  ok,
  sourcePath,
  destinationPath,
  sourceBytes,
  destinationBytes,
  fromSchemaVersion,
  preExistingDiagnostics = [],
  migrationDiagnostics = [],
  newSchemaDiagnostics = [],
  changedCoordinates = [],
  oldRequiredViewBox = null,
  newRequiredViewBox = null,
}) {
  const report = {
    ok,
    command: 'migrate',
    type: 'workflow',
    source: {
      path: sourcePath,
      ...(sourceBytes ? {
        sha256: createHash('sha256').update(sourceBytes).digest('hex'),
        bytes: sourceBytes.length,
      } : {}),
    },
    destination: {
      path: destinationPath,
      ...(destinationBytes ? {
        sha256: createHash('sha256').update(destinationBytes).digest('hex'),
        bytes: destinationBytes.length,
      } : {}),
    },
    fromSchemaVersion: fromSchemaVersion ?? null,
    toSchemaVersion: 2,
    preExistingDiagnostics,
    migrationDiagnostics,
    newSchemaDiagnostics,
    changedCoordinates,
    oldRequiredViewBox,
    newRequiredViewBox,
  };
  if (!ok) {
    report.diagnostics = [
      ...migrationDiagnostics,
      ...newSchemaDiagnostics,
      ...preExistingDiagnostics,
    ];
    if (!report.diagnostics.length) {
      report.diagnostics.push(diagnostic({
        code: 'migration/internal',
        message: translateCliMessage('migration.unclassified'),
      }));
    }
    report.error = report.diagnostics[0].message;
  }
  return report;
}

function extractMigrationOptions(args) {
  const positional = [];
  let json = false;
  let toSchema;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--to-schema') {
      toSchema = args[index + 1];
      if (!toSchema || toSchema.startsWith('--')) fail(translateCliMessage('error.to-schema-required'));
      index += 1;
      continue;
    }
    if (arg.startsWith('--to-schema=')) {
      toSchema = arg.slice('--to-schema='.length);
      if (!toSchema) fail(translateCliMessage('error.to-schema-required'));
      continue;
    }
    if (arg.startsWith('--')) fail(translateCliMessage('error.unknown-option', { command: 'migrate', option: arg }));
    positional.push(arg);
  }
  return { positional, json, toSchema };
}

async function commandMigrate(args) {
  const options = extractMigrationOptions(args);
  const [type, sourceArgument, destinationArgument] = options.positional;
  if (
    type !== 'workflow'
    || !sourceArgument
    || !destinationArgument
    || options.positional.length !== 3
    || options.toSchema !== '2'
  ) {
    fail(translateCliMessage('usage.migrate'));
  }

  const sourcePath = path.resolve(sourceArgument);
  const destinationPath = path.resolve(destinationArgument);
  let sourceBytes;
  let sourceDocument;
  const reportMigrationFailure = ({ status = 1, ...details }) => {
    const report = migrationReport({
      ...details,
      ok: false,
      sourcePath,
      destinationPath,
      sourceBytes,
      fromSchemaVersion: sourceDocument?.schema_version,
    });
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else console.error(formatDiagnostics(report.error, report.diagnostics));
    process.exitCode = status;
  };
  try {
    sourceBytes = fs.readFileSync(sourcePath);
    sourceDocument = JSON.parse(sourceBytes.toString('utf8'));
  } catch (error) {
    reportMigrationFailure({
      preExistingDiagnostics: [inputDiagnostic(error, sourcePath)],
    });
    return;
  }
  // Unlike render/validate, migrate has no --quality override. Pin every stage
  // to the document's durable policy and scrub any ambient profile from the
  // staged renderer by passing this value explicitly.
  const activeQualityProfile = sourceDocument?.meta?.quality_profile || 'standard';

  const { pathsAlias } = await import('../renderers/shared/output-path.mjs');
  let sourceDestinationAlias;
  try {
    sourceDestinationAlias = pathsAlias(sourcePath, destinationPath);
  } catch (error) {
    reportMigrationFailure({
      migrationDiagnostics: migrationPathDiagnostics(error, sourcePath, destinationPath),
    });
    return;
  }
  if (sourceDestinationAlias) {
    reportMigrationFailure({
      migrationDiagnostics: [diagnostic({
        code: 'migration/source-destination',
        message: translateCliMessage('migration.distinct-files'),
        subject: { source: sourcePath, destination: destinationPath },
        supportedFixes: [translateCliMessage('migration.fix.distinct-files')],
      })],
    });
    return;
  }

  const { migrateWorkflowDocument, serializeMigratedWorkflow } = await import('../migrations/workflow-v2.mjs');
  let migration;
  try {
    migration = migrateWorkflowDocument(sourceDocument);
  } catch (error) {
    migration = {
      ok: false,
      migrationDiagnostics: [diagnostic({
        code: 'migration/internal',
        message: translateCliMessage('migration.unexpected'),
        evidence: { reason: error.message },
        supportedFixes: [translateCliMessage('migration.fix.report')],
      })],
    };
  }

  if (!migration.ok) {
    reportMigrationFailure(migration);
    return;
  }

  if (fs.existsSync(destinationPath) && !fs.lstatSync(destinationPath).isFile()) {
    reportMigrationFailure({
      ...migration,
      migrationDiagnostics: [...migration.migrationDiagnostics, diagnostic({
        code: 'migration/destination-type',
        message: translateCliMessage('migration.destination-type'),
        subject: { destination: destinationPath },
        supportedFixes: [translateCliMessage('migration.fix.destination-type')],
      })],
    });
    return;
  }

  const destinationDirectory = path.dirname(destinationPath);
  let stagingDirectory;
  try {
    fs.mkdirSync(destinationDirectory, { recursive: true });
    stagingDirectory = fs.mkdtempSync(path.join(destinationDirectory, '.archify-migration-'));
  } catch (error) {
    reportMigrationFailure({
      ...migration,
      migrationDiagnostics: [...migration.migrationDiagnostics, diagnostic({
        code: 'migration/prepare-destination',
        message: translateCliMessage('migration.prepare-destination'),
        subject: { destination: destinationPath },
        evidence: { ...(error?.code ? { systemCode: error.code } : {}), reason: error.message },
        supportedFixes: [translateCliMessage('migration.fix.destination-directory')],
      })],
    });
    return;
  }

  const candidatePath = path.join(stagingDirectory, 'candidate.workflow.json');
  const artifactPath = path.join(stagingDirectory, 'migration-check.html');
  const destinationBytes = Buffer.from(serializeMigratedWorkflow(migration.document));
  try {
    fs.writeFileSync(candidatePath, destinationBytes, { flag: 'wx' });
    const render = runNode([rendererPath('workflow'), candidatePath, artifactPath], {
      stdio: 'pipe',
      env: rendererEnv(activeQualityProfile, undefined, true),
    });
    if (render.status !== 0) {
      const failure = rendererFailure(render);
      reportMigrationFailure({
        ...migration,
        newSchemaDiagnostics: [...migration.newSchemaDiagnostics, ...failure.diagnostics],
        status: render.status ?? 1,
      });
      return;
    }

    const check = runNode([path.join(skillRoot, 'scripts/check-render-output.mjs'), artifactPath], {
      stdio: 'pipe',
    });
    if (check.status !== 0) {
      let checker;
      try {
        checker = JSON.parse(check.stdout);
      } catch {
        checker = null;
      }
      reportMigrationFailure({
        ...migration,
        newSchemaDiagnostics: [
          ...migration.newSchemaDiagnostics,
          ...checkerDiagnostics(checker),
        ],
        status: check.status ?? 1,
      });
      return;
    }

    if (pathsAlias(sourcePath, destinationPath)) {
      reportMigrationFailure({
        ...migration,
        migrationDiagnostics: [...migration.migrationDiagnostics, diagnostic({
          code: 'migration/source-destination',
          message: translateCliMessage('migration.alias-before-commit'),
          subject: { source: sourcePath, destination: destinationPath },
          supportedFixes: [translateCliMessage('migration.fix.retry-destination')],
        })],
      });
      return;
    }
    const currentSourceBytes = fs.readFileSync(sourcePath);
    if (!currentSourceBytes.equals(sourceBytes)) {
      reportMigrationFailure({
        ...migration,
        migrationDiagnostics: [...migration.migrationDiagnostics, diagnostic({
          code: 'migration/source-changed',
          message: translateCliMessage('migration.source-changed'),
          subject: { source: sourcePath },
          supportedFixes: [translateCliMessage('migration.fix.stable-source')],
        })],
      });
      return;
    }

    fs.renameSync(candidatePath, destinationPath);
    const report = migrationReport({
      ...migration,
      sourcePath,
      destinationPath,
      sourceBytes,
      destinationBytes,
      fromSchemaVersion: sourceDocument.schema_version,
    });
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else if (sourceDocument.schema_version === 1) {
      console.log(translateCliMessage('migration.success-v1', { source: sourcePath, destination: destinationPath }));
    } else {
      console.log(translateCliMessage('migration.success-v2', { source: sourcePath, destination: destinationPath }));
    }
  } catch (error) {
    const migrationDiagnostics = Array.isArray(error?.archifyDiagnostics)
      ? migrationPathDiagnostics(error, sourcePath, destinationPath)
      : [diagnostic({
        code: 'migration/commit',
        message: translateCliMessage('migration.commit'),
        subject: { destination: destinationPath },
        evidence: { ...(error?.code ? { systemCode: error.code } : {}), reason: error.message },
        supportedFixes: [translateCliMessage('migration.fix.commit')],
      })];
    reportMigrationFailure({
      ...migration,
      migrationDiagnostics: [...migration.migrationDiagnostics, ...migrationDiagnostics],
    });
  } finally {
    try {
      fs.rmSync(stagingDirectory, { recursive: true, force: true });
    } catch (error) {
      console.error(translateCliMessage('migration.cleanup-warning', { directory: stagingDirectory, reason: error.message }));
    }
  }
}

function commandValidate(args) {
  const qualityArgs = extractQualityArgs(args);
  const repoArgs = extractRepoRootArgs(qualityArgs.rest);
  args = repoArgs.rest;
  const quality = qualityArgs.quality;
  const repoRoot = repoArgs.repoRoot;
  const knownOptions = new Set(['--json', '--layout-json']);
  const unknown = args.filter((arg) => arg.startsWith('--') && !knownOptions.has(arg));
  if (unknown.length) fail(translateCliMessage('error.unknown-option', { command: 'validate', option: unknown[0] }));
  const json = args.includes('--json');
  const layoutJson = args.includes('--layout-json');
  const rest = args.filter((arg) => !knownOptions.has(arg));
  const [type, input] = rest;
  if (!type || !input || rest.length !== 2) fail(usage());
  assertEvidenceType(type, repoRoot);
  const renderer = rendererPath(type);

  if (layoutJson) {
    if (!['architecture', 'workflow'].includes(type)) {
      fail(translateCliMessage('error.layout-json-types'));
    }
    const result = runNode([renderer, input, '/dev/null', '--layout-json'], {
      stdio: 'pipe',
      env: rendererEnv(quality, repoRoot, true),
    });
    if (result.status !== 0) {
      try {
        const receipt = JSON.parse(result.stdout);
        if (receipt?.contract && Array.isArray(receipt.diagnostics)) {
          process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
          process.exitCode = result.status ?? 1;
          return;
        }
      } catch {
        // Fall through to the renderer failure contract when no compiler
        // receipt was produced (for example, input JSON could not be read).
      }
      const failure = rendererFailure(result);
      reportValidateFailure({
        json,
        stage: failure.diagnostics.some((entry) => entry.code.startsWith('input/')) ? 'input' : 'render',
        type,
        input: path.resolve(input),
        error: failure.error,
        diagnostics: failure.diagnostics,
        status: result.status ?? 1,
      });
      return;
    }
    process.stdout.write(result.stdout);
    return;
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-validate-'));
  const out = path.join(tmp, `${type}.html`);
  let exitCode = 0;

  try {
    const render = runNode([renderer, input, out], {
      stdio: 'pipe',
      env: rendererEnv(quality, repoRoot, true),
    });
    if (render.status !== 0) {
      const failure = rendererFailure(render);
      reportValidateFailure({
        json,
        stage: failure.diagnostics.some((entry) => entry.code.startsWith('input/')) ? 'input' : 'render',
        type,
        input: path.resolve(input),
        error: failure.error,
        diagnostics: failure.diagnostics,
        status: render.status ?? 1,
      });
      exitCode = render.status ?? 1;
    } else {
      const check = runNode([path.join(skillRoot, 'scripts/check-render-output.mjs'), out], { stdio: 'pipe' });
      if (check.status !== 0) {
        let checker;
        try {
          checker = JSON.parse(check.stdout);
          checker.file = path.resolve(input);
        } catch {
          checker = { ok: false, diagnostic: translateCliMessage('validate.checker-unparseable') };
        }
        reportValidateFailure({
          json,
          stage: 'check',
          type,
          input: path.resolve(input),
          error: translateCliMessage('validate.final-check-failed'),
          diagnostics: checkerDiagnostics(checker),
          checker,
          status: check.status ?? 1,
        });
        exitCode = check.status ?? 1;
      } else {
        const result = JSON.parse(check.stdout);
        const engineeringProfile = engineeringProfileFromArtifact(fs.readFileSync(out));
        if (json) {
          console.log(JSON.stringify({
            schemaVersion: 1,
            ok: true,
            command: 'validate',
            type,
            input: path.resolve(input),
            checks: result.checks,
            composition: result.composition,
            ...(engineeringProfile ? { engineeringProfile } : {}),
          }, null, 2));
        } else {
          const engineering = engineeringProfile
            ? translateCliMessage('validate.engineering-pass', { profile: engineeringProfile })
            : '';
          console.log(translateCliMessage('validate.success', { type, input: path.resolve(input), checks: result.checks.length, profile: result.composition.profile, errors: result.composition.summary.errors, warnings: result.composition.summary.warnings, engineering }));
        }
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  if (exitCode !== 0) process.exitCode = exitCode;
}

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case undefined:
  case '-h':
  case '--help':
  case 'help':
    console.log(usage());
    break;
  case 'render':
    commandRender(args);
    break;
  case 'compare':
    await commandCompare(args);
    break;
  case 'deliver':
    await commandDeliver(args);
    break;
  case 'preview':
    await commandPreview(args);
    break;
  case 'validate':
    commandValidate(args);
    break;
  case 'migrate':
    await commandMigrate(args);
    break;
  case 'inspect':
    if (args[0] !== 'architecture') {
      fail(translateCliMessage('error.inspect-architecture-only'));
    }
    commandValidate([...args, '--layout-json']);
    break;
  case 'check':
    commandCheck(args);
    break;
  case 'visual-check':
    await commandVisualCheck(args);
    break;
  case 'guide':
    await commandGuide(args);
    break;
  case 'brands':
    await commandBrands(args);
    break;
  case 'examples':
    commandExamples();
    break;
  case 'doctor':
    await commandDoctor();
    break;
  case 'demo':
    commandDemo(args);
    break;
  default:
    fail(`${translateCliMessage('error.unknown-command', { command })}\n\n${usage()}`);
}
