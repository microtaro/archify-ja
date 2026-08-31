import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.join(here, '..');
const read = (relative) => readFileSync(path.join(skillRoot, relative), 'utf8');
const skill = read('SKILL.md');
const authoring = read('references/authoring-contract.md');
const delivery = read('references/delivery-contract.md');

const translatedDocuments = [
  'SKILL.md',
  'references/authoring-contract.md',
  'references/brand-marks.md',
  'references/cli-messages.ja-review.md',
  'references/delivery-contract.md',
  'references/viewer-messages.ja-review.md',
  'references/viewer-runtime.md',
  'schemas/README.md',
  'brand-marks/README.md',
  'renderers/dataflow/README.md',
  'renderers/lifecycle/README.md',
  'renderers/sequence/README.md',
  'renderers/workflow/README.md',
];

function frontmatterDescription(markdown) {
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(frontmatter, 'SKILL.md must start with YAML frontmatter');
  return frontmatter[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
}

function relativeMarkdownLinks(markdown) {
  return [...markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)]
    .map((match) => match[1].trim().replace(/^<|>$/g, ''))
    .filter((target) => !/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target));
}

function markdownAnchors(markdown) {
  const explicit = [...markdown.matchAll(/<a\s+id=["']([^"']+)["']\s*><\/a>/gi)]
    .map((match) => match[1]);
  const headings = [...markdown.matchAll(/^#{1,6}\s+(.+)$/gm)]
    .map((match) => match[1]
      .trim()
      .toLowerCase()
      .replace(/[`*_~()[\]{}<>]/g, '')
      .replace(/\s+/g, '-'));
  return new Set([...explicit, ...headings]);
}

test('日本語のSkill descriptionは検索triggerを保ったまま1024 bytes以内に収まる', () => {
  const description = frontmatterDescription(skill);
  assert.ok(description, 'frontmatter must include a one-line description');
  assert.ok(Buffer.byteLength(description, 'utf8') <= 1024, 'description must fit a 1024-byte runtime limit');
  assert.match(description, /[ぁ-んァ-ヶ一-龠]/u, 'description must be natural Japanese, not an English placeholder');

  for (const trigger of ['architecture', 'workflow', 'sequence', 'data-flow', 'lifecycle', 'Mermaid']) {
    assert.match(description, new RegExp(`\\b${trigger}\\b`, 'i'), `description must retain the ${trigger} trigger`);
  }
});

test('翻訳対象文書の相対Markdown linkはSkill内で解決する', () => {
  for (const relative of translatedDocuments) {
    const sourcePath = path.join(skillRoot, relative);
    for (const target of relativeMarkdownLinks(read(relative))) {
      const hashAt = target.indexOf('#');
      const pathname = hashAt === -1 ? target : target.slice(0, hashAt);
      const fragment = hashAt === -1 ? '' : decodeURIComponent(target.slice(hashAt + 1));
      const resolved = path.resolve(path.dirname(sourcePath), decodeURIComponent(pathname));
      assert.ok(
        resolved === skillRoot || resolved.startsWith(`${skillRoot}${path.sep}`),
        `${relative} links outside the packaged skill: ${target}`,
      );
      assert.equal(existsSync(resolved), true, `${relative} references missing link target ${target}`);
      if (fragment) {
        assert.ok(
          markdownAnchors(readFileSync(resolved, 'utf8')).has(fragment),
          `${relative} references missing link fragment ${target}`,
        );
      }
    }
  }
});

test('候補は検証後にfreezeし、その後の編集を禁止する', () => {
  assert.match(skill, /最終[^。\n]*検証[^。\n]*(?:合格|成功)[^。\n]*(?:凍結|freeze)/u);
  assert.match(skill, /(?:凍結|freeze)[^。\n]*(?:後|以降)[^。\n]*(?:編集|変更)[^。\n]*(?:しない|禁止)/u);
  assert.match(delivery, /(?:凍結|freeze)[^。\n]*(?:後|した後)[^。\n]*(?:deliver|配布)/u);
});

test('修正は最大2回で止まり、成功していない状態を成功としない', () => {
  assert.match(delivery, /修正[^。\n]*(?:0|1|2)[^。\n]*(?:回|round)/u);
  assert.match(delivery, /(?:最大|上限)[^。\n]*2[^。\n]*回/u);
  assert.match(delivery, /2[^。\n]*回[^。\n]*(?:超え|上回)[^。\n]*(?:ない|なりません|禁止)/u);
  assert.match(skill, /(?:ゼロ以外|非ゼロ|non-zero)[^。\n]*(?:成功|合格)[^。\n]*(?:扱|説明|報告)[^。\n]*(?:ない|なりません|禁止)/u);
});

test('実在コードの図はrepository evidenceを先に検証し、事実を創作しない', () => {
  assert.match(skill, /実在するコード[^。\n]*(?:リポジトリ|repository)[^。\n]*(?:証拠|evidence)[^。\n]*(?:調査|確認|検証)/iu);
  assert.match(authoring, /エントリポイント/u);
  assert.match(authoring, /実行時の境界/u);
  assert.match(authoring, /ストレージ/u);
  assert.match(authoring, /トランスポート/u);
  assert.match(authoring, /デプロイ/u);
  assert.match(authoring, /実際に検証した[^。\n]*(?:証拠|もの)/u);
  assert.match(authoring, /ファイル[^。\n]*(?:近さ|近接)[^。\n]*(?:名前|命名)[^。\n]*(?:因果関係|因果性)[^。\n]*(?:推測|推論)[^。\n]*(?:しない|なりません|禁止)/u);
});

test('関係labelは意味を保ち、geometry修正のために削除しない', () => {
  for (const document of [skill, authoring]) {
    assert.match(document, /関係[^。\n]*(?:ラベル|label)[^。\n]*(?:意味|セマンティック)[^。\n]*(?:データ|情報)/u);
    assert.match(document, /(?:削除|消去)[^。\n]*(?:geometry|ジオメトリ|配置|間隔)[^。\n]*(?:修正|repair)[^。\n]*(?:ではない|ではありません|にならない)/u);
  }
});

test('主要な保守文書は日本語の見出しと説明を持つ', () => {
  for (const relative of translatedDocuments) {
    const markdown = read(relative);
    assert.match(markdown, /^# .*[ぁ-んァ-ヶ一-龠]/mu, `${relative} must have a Japanese H1`);
    assert.match(markdown, /[ぁ-んァ-ヶ一-龠]{2,}/u, `${relative} must contain Japanese prose`);
  }
});
