import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');
const skill = fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8');
const authoringContract = fs.readFileSync(
  path.join(skillRoot, 'references', 'authoring-contract.md'),
  'utf8',
);
const schemaReadme = fs.readFileSync(path.join(skillRoot, 'schemas', 'README.md'), 'utf8');

test('semantic relationship labels are preserved and deletion is not a geometry repair', () => {
  for (const [name, source] of [['SKILL.md', skill], ['authoring contract', authoringContract]]) {
    assert.match(source, /関係ラベルは意味を持つデータです/i, name);
    assert.match(source, /labelを移動し、routeまたはspacingを調整し[\s\S]*表現を短く/i, name);
    assert.match(source, /protocol[\s\S]*action[\s\S]*direction[\s\S]*synchronous[\s\S]*asynchronous[\s\S]*cross-boundary mechanism/i, name);
    assert.match(source, /両endpointからすでに完全に明白で[\s\S]*表現だけを省略できます/i, name);
    assert.match(source, /意味のあるlabelはすべて維持してください/i, name);
    assert.match(source, /削除はジオメトリ修正ではありません/i, name);
  }
});

test('schema policy documents the workflow v1/v2 compatibility boundary', () => {
  assert.match(schemaReadme, /Workflowは[^\n]*schema version 1と2/);
  assert.match(schemaReadme, /他の4種類[^\n]*`schema_version`[^\n]*`1`/);
  assert.doesNotMatch(schemaReadme, /schema_version` is `"const": 1`/);
});

test('deployment ownership stays explicit, fact-backed, and cannot be removed to pass', () => {
  assert.match(skill, /`meta\.engineering_profile` は既定で省略します/);
  assert.match(skill, /region、cluster、security boundary[^\n]*だけでは有効になりません/);
  assert.match(skill, /production deployment topology、ownership handoff、またはfail-closed deployment review/);
  assert.match(skill, /検証を通すためだけにengineering profileを削除してはなりません/i);
});

test('visual-check stays a pending sidecar receipt instead of a polish claim', () => {
  const deliveryContract = fs.readFileSync(
    path.join(skillRoot, 'references', 'delivery-contract.md'),
    'utf8',
  );
  for (const [name, source] of [['SKILL.md', skill], ['delivery contract', deliveryContract]]) {
    assert.match(source, /visual-check <output\.html> --json/, name);
    assert.match(source, /1440×900[\s\S]*1600×1000[\s\S]*1920×1080[\s\S]*2048×1320/, name);
    assert.match(source, /visualReview: "pending"/, name);
    assert.match(source, /信頼済みHTMLを(?:再renderまたは変更|変更または再render)せず/, name);
  }
});
