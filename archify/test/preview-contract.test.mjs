import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(here, '..');
const repoRoot = path.resolve(skillRoot, '..');
const skill = fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8');
const delivery = fs.readFileSync(path.join(skillRoot, 'references', 'delivery-contract.md'), 'utf8');
const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
const english = fs.readFileSync(path.join(repoRoot, 'README_EN.md'), 'utf8');

test('preview contract: the skill keeps live preview explicit, desktop-only, and last-good', () => {
  assert.match(delivery, /archify\.mjs preview <type> <input>\.json <output>\.html/);
  assert.match(delivery, /稼働中のdesktop authoring loop/);
  assert.match(delivery, /以前の検証済みrevisionを画面とdiskに/);
  assert.match(delivery, /never start it by default/i);
  assert.match(delivery, /CI, unattended agents, remote sharing, or mobile use/i);
  assert.match(delivery, /must never enter the generated artifact or any export/i);
});

test('preview contract: English README mirrors document the same optional command without changing the hero', () => {
  assert.equal(readme, english);
  for (const text of [readme, english]) {
    assert.match(text, /bin\/archify\.mjs preview workflow/);
    assert.match(text, /--no-open/);
    assert.match(text, /127\.0\.0\.1/);
    assert.match(text, /Ctrl-C/);
    assert.match(text, /docs\/assets\/archify-readme-hero\.png/);
  }
});

test('preview contract: the canonical delivery reference owns no-leak and zero-dependency boundaries', () => {
  assert.match(delivery, /Last-Good Live Preview/);
  assert.match(delivery, /zero-dependency Skill ZIP/i);
  assert.match(delivery, /server state、port、source path、diagnostic、error text、reload tokenを[^\n]*決して入れてはなりません/);
});
