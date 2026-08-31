import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const skill = readFileSync(path.join(here, '..', 'SKILL.md'), 'utf8');
const delivery = readFileSync(path.join(here, '..', 'references', 'delivery-contract.md'), 'utf8');

test('skill requires a bounded and truthful perceptual delivery receipt', () => {
  assert.match(delivery, /visual_review: passed/);
  assert.match(delivery, /visual_review: skipped \(image reader unavailable\)/);
  assert.match(delivery, /correction_rounds: [0-2]/);
  assert.match(delivery, /2回連続の修正roundでその最小値が改善しなければ停止/);
  assert.match(delivery, /never report `visual_review: passed` without inspecting/i);
});

test('skill uses atomic verified delivery for the final artifact', () => {
  assert.match(delivery, /archify\.mjs deliver <type>/);
  assert.match(delivery, /同じdirectory内のprivate candidate snapshot/);
  assert.match(delivery, /only replaces the target after.*artifact checks pass/i);
  assert.match(delivery, /never claim that the deterministic receipt includes visual review/i);
});

test('skill keeps optional opening behind the verified commit and outside automation', () => {
  assert.match(delivery, /ユーザーが即時のlocal previewを求めた場合にだけ `--open` を加えます/);
  assert.match(delivery, /runs after that atomic commit/);
  assert.match(delivery, /Keep it off for CI, unattended agents, and non-interactive environments/);
  assert.match(delivery, /never invokes an opener/);
  assert.match(delivery, /status proves only whether the local opener invocation succeeded/);
});
