import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(skillRoot, '..');
const cursorCommand = 'npx -y skills add tt-a1i/archify --skill archify --agent cursor --global --copy --yes';

test('Cursor onboarding stays explicit and backed by the same Skill', () => {
  const english = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  const englishMirror = fs.readFileSync(path.join(repoRoot, 'README_EN.md'), 'utf8');
  const start = fs.readFileSync(path.join(repoRoot, 'docs', 'start.html'), 'utf8');
  const landing = fs.readFileSync(path.join(repoRoot, 'docs', 'index.html'), 'utf8');

  assert.equal(english, englishMirror, 'English README mirrors must stay synchronized');
  assert.match(english, /Cursor, Claude Code, Codex CLI, and OpenCode/);
  for (const surface of [english, landing]) assert.ok(surface.includes(cursorCommand));
  for (const surface of [english, start, landing]) {
    assert.doesNotMatch(surface, /skills use[^\n<]*--agent cursor/);
    assert.doesNotMatch(surface, /~\/\.cursor\/skills\/archify/);
    assert.doesNotMatch(surface, /all Cursor models|every Cursor model/i);
  }

  assert.match(start, /data-agent="cursor">Cursor<\/button>/);
  assert.match(start, /data-agent="codex">Codex<\/button>/);
  assert.match(start, /data-agent="claude-code">Claude Code<\/button>/);
  assert.match(start, /data-agent="opencode">OpenCode<\/button>/);
  assert.match(start, /KNOWN_AGENTS\.has\(requestedAgent\)/);
  assert.match(start, /same Skill/);
  assert.doesNotMatch(start, /vendor-specific (?:renderer|schema|skill)/i);
});
