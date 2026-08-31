import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.join(here, '..');
const skill = readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8');
const authoringContract = readFileSync(path.join(skillRoot, 'references', 'authoring-contract.md'), 'utf8');
const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/);

test('skill description is portable across 1024-character runtimes and remains searchable', () => {
  assert.ok(frontmatter, 'SKILL.md must start with YAML frontmatter');
  const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  assert.ok(description, 'frontmatter must include a one-line description');
  assert.ok(description.length <= 1024, `description is ${description.length} characters; maximum is 1024`);
  assert.ok(Buffer.byteLength(description, 'utf8') <= 1024, 'description must also fit a 1024-byte runtime limit');

  for (const trigger of ['architecture', 'workflow', 'sequence', 'data-flow', 'lifecycle', 'Mermaid']) {
    assert.match(description, new RegExp(`\\b${trigger}\\b`, 'i'), `description must retain the ${trigger} trigger`);
  }
  assert.match(description, /standalone HTML/i);
  assert.match(description, /(?:場合|とき)に利用する/);
});

test('literal packaged-skill path references resolve inside the installed skill root', () => {
  const references = [...skill.matchAll(/`((?:assets|bin|examples|recipes|references|renderers|schemas|scripts)\/[^`\s]+)`/g)]
    .map((match) => match[1])
    .filter((reference) => !/[<>{}*\[\]]/.test(reference));

  assert.ok(references.length > 0, 'expected literal packaged-skill references');
  for (const reference of new Set(references)) {
    assert.equal(existsSync(path.join(skillRoot, reference)), true, `SKILL.md references missing packaged path ${reference}`);
  }
});

test('main skill stays a bounded authoring router with progressive references', () => {
  const lines = skill.trimEnd().split('\n');
  assert.ok(lines.length <= 160, `SKILL.md is ${lines.length} lines; keep the entrypoint at 160 or fewer`);
  for (const reference of [
    'references/authoring-contract.md',
    'references/viewer-runtime.md',
    'references/delivery-contract.md',
  ]) {
    assert.match(skill, new RegExp(reference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(existsSync(path.join(skillRoot, reference)), true, `${reference} must ship with the skill`);
  }
});

test('update awareness is notification-only and never replaces the requested workflow', () => {
  assert.match(skill, /`scripts\/check-update\.mjs`/);
  assert.match(skill, /`silent`[\s\S]*言及せず/);
  assert.match(skill, /`update_available`[\s\S]*簡潔な通知/);
  assert.match(skill, /通知は情報であり、許可ではありません/);
  assert.match(skill, /`severity` が `security`[\s\S]*security update[\s\S]*強調だけ[\s\S]*自律性ではありません/);
  assert.match(skill, /ユーザーが最初に依頼したtaskを続けます/);
  assert.match(skill, /インストール済み(?:Skill|version)は変更されて(?:おらず|いません)/);
  assert.doesNotMatch(skill, /npx skills update|gh skill update/i);
});

test('language behavior stays within the bounded locale contract', () => {
  assert.match(skill, /primary authored languageを1つ選びます/);
  assert.match(skill, /明示されたユーザーの選択[\s\S]*選択がなければ、依頼または会話の主言語/);
  assert.match(skill, /`meta\.locale` が制御するのはrenderer所有のViewer UIだけ/);
  assert.match(skill, /対応Viewer言語には `"en"` を使います/);
  assert.doesNotMatch(skill, /zh-CN|Simplified Chinese/);
  assert.match(skill, /それ以外のすべての言語では `meta\.locale` を省略/);
  assert.match(skill, /固定Viewer UIと `<html lang>` がEnglishへfallback/);
  assert.match(skill, /rendererがauthored contentを翻訳することはありません/);
  assert.match(skill, /製品名、code identifier、command、protocol、API path、environment name/);
  assert.match(authoringContract, /`meta\.locale` が制御するのはrenderer所有のreader surfaceだけ/);
  assert.match(authoringContract, /`en` 以外の言語/);
  assert.match(authoringContract, /成果物が完全にはローカライズされない/);
  assert.doesNotMatch(authoringContract, /zh-CN|Simplified Chinese|Chinese locale/);
  assert.match(authoringContract, /authored contentを翻訳することはありません/);
  assert.match(authoringContract, /renderer所有の既定legend labelは `meta\.locale` に従います/);
  assert.match(authoringContract, /fallbackが適用されるのはrenderer所有surfaceだけ/);
});

test('skill keeps the title hierarchy compact by default', () => {
  assert.match(skill, /`meta\.subtitle` は既定で省略/);
  assert.match(skill, /title、node、cardの言い換えとなるsubtitleを決して創作してはなりません/);
  assert.match(authoringContract, /subtitleを省略または空にした際、生成viewerに空のvisual rowが残ってはなりません/);
});
