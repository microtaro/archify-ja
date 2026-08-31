import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.join(here, '..');
const read = (relative) => readFileSync(path.join(skillRoot, relative), 'utf8');
const skill = read('SKILL.md');

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

const englishStructuralBaseline = {
  'SKILL.md': ['23a5224aface71e2d8ed36204a9e83f468d402c40829658ece5ebcf943428582', '569ba4dab91e60d42481139e6c4ea9adcbb494f2148dcba3572553f6690cde1c', { 0: 6, 1: 4, 2: 5, 3: 1, 4: 3, 5: 1, 8: 1, 9: 1, 12: 1, 16: 2, 256: 1, 900: 2, 1000: 2, 1080: 2, 1320: 2, 1440: 2, 1600: 2, 1920: 2, 2048: 2, '2.16': 1 }],
  'references/authoring-contract.md': ['7751fb6fb1ecf695b2fb7d24f5834ba3589eac0557b0fb58f65ab5c6208e2c61', 'f74ec3024869f00b1f28f2f70d80ddaff022a655fd695507a9c897739c30b32c', { 0: 4, 1: 1, 2: 3, 3: 1, 4: 2, 5: 3, 6: 1, 8: 3, 12: 1, 13: 1, 16: 5, 24: 1, 35: 1, 165: 1, 200: 1, '6.5': 1 }],
  'references/brand-marks.md': ['4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945', '2155e3d04c364ed55caf70ab676502c03d062cf6761a23f2c946720afadc7305', { 1: 1, 2: 1, 3: 1, 4: 1, 56: 1, 123456789: 3, '0123456789': 1 }],
  'references/delivery-contract.md': ['dd1f8d130e520f1363c59ae3e2d4459521c0d436d31f1282dc9238cbd1c1ab3c', '8a43776ef2b56a4684c767482ab918cfb32b0572339a05475f2600631ce569c1', { 0: 5, 1: 3, 2: 3, 9: 2, 56: 2, 256: 2, 900: 3, 1000: 2, 1080: 2, 1320: 3, 1440: 3, 1600: 2, 1920: 2, 2048: 3 }],
  'references/viewer-runtime.md': ['4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945', '25337b441e0f5dca914d15370b5e0d4917a785df019ff7186b0832ef67c612e2', { 100: 2, 175: 1, 630: 1, 1200: 1 }],
  'schemas/README.md': ['08fb992775190aa10914f64b9d9f11bf33ea831d4b92b05ba6a8204f6d66603d', 'ec79c3204e89f1bc47c49cc48822487f306f01b140a2a710adcc80eac43f22cb', { 1: 3, 2: 4, 3: 1, 9: 1, 12: 1, 56: 1, 86: 1, 108: 1, 2020: 1 }],
  'brand-marks/README.md': ['5a0834feec77b177c510fa67b1ea4dfbb6e8cb56b282b839bb1daac62b987a27', '0885f5ab3d960c146931892ffcef7392ba80a9b0ed6cfcb93acfb16e0f349f6a', { 0: 1, 107: 1, '16.28': 1 }],
  'renderers/dataflow/README.md': ['9628947318bf9f20723aa23e8c918ae40b763de71d2a5671f6ae0d43235cead9', 'bc8b34f0ce78764660c41571ea0dad4bf9b2d8c416be5aa9b71a483cc61c9515', { 0: 1, 1: 1, 2: 2, 4: 1, 5: 1, 8: 3, 10: 1, 15: 1, 16: 1, 24: 2, 34: 1, 36: 1, 46: 1, 58: 1, 74: 1, 100: 1, 104: 1, 112: 1, 128: 1, 168: 1, 215: 1, 242: 1, 356: 1, 360: 2, 470: 1, 584: 1, 720: 2, 940: 2 }],
  'renderers/lifecycle/README.md': ['d1abba6f96ea9496868f71964376eb5062aec29b2c858e1fa12041e5677d057f', 'a454ebb451aa226793482b9961cd2f7270608985d7ccd0c6cc90f2859227d1e0', { 0: 5, 1: 2, 2: 6, 3: 1, 4: 3, 8: 3, 10: 2, 15: 1, 16: 1, 32: 3, 36: 1, 58: 2, 62: 1, 94: 1, 118: 2, 122: 1, 126: 2, 248: 1, 278: 1, 402: 3, 420: 1, 450: 1, 556: 3, 566: 1, 660: 2, 710: 3, 980: 2, '01': 1, '02': 1, '03': 1 }],
  'renderers/sequence/README.md': ['21881eea13d6aa12ff2b72163d2c59ac432be2f20278bdd5f32b3f62d953df3e', '0c664c7494630422f780a158b6e0afc328b7715476ae534dd378697e379ca272', { 1: 1, 8: 3, 15: 1, 16: 1, 20: 1, 28: 1, 40: 1, 54: 2, 60: 1, 62: 1, 65: 1, 72: 2, 83: 1, 86: 3, 108: 1, 120: 1, 142: 1, 160: 1, 190: 1, 480: 2, 760: 2, 920: 2 }],
  'renderers/workflow/README.md': ['6c9136b5122440adc057ccb4fb355c13f18fd7faf72a90a64b1e3724d9e0deb1', '0c5f217da47d0482b36ccd0a7f12994e8cc398e9aca3120be16fd39d7510a0a8', { 0: 7, 1: 4, 2: 5, 3: 1, 4: 1, 5: 4, 8: 7, 15: 1, 16: 2, 18: 1, 20: 2, 28: 3, 30: 1, 40: 1, 44: 1, 52: 3, 68: 1, 70: 2, 80: 2, 88: 1, 92: 2, 104: 2, 120: 1, 124: 1, 125: 1, 130: 1, 132: 1, 220: 1, 300: 1, 430: 1, 500: 1, 625: 1, 640: 1, 720: 2 }],
};

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

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function fencedCodeBlocks(markdown) {
  return [...markdown.matchAll(/^```[^\n]*\n([\s\S]*?)^```$/gm)].map((match) => match[1]);
}

function inlineCodeTokens(markdown) {
  return [...markdown.matchAll(/(?<!`)`([^\n`]+)`(?!`)/g)].map((match) => match[1]).sort();
}

function numericTokenCounts(markdown) {
  const counts = {};
  for (const match of markdown.matchAll(/(?<![A-Za-z])\d+(?:\.\d+)?/g)) {
    counts[match[0]] = (counts[match[0]] || 0) + 1;
  }
  return counts;
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

test('翻訳文書は英語sourceのcode fence、inline code、数値構造を保つ', () => {
  for (const [relative, [fencedDigest, inlineDigest, minimumNumbers]] of Object.entries(englishStructuralBaseline)) {
    const markdown = read(relative);
    assert.equal(digest(fencedCodeBlocks(markdown)), fencedDigest, `${relative} changed fenced code from the English source`);
    assert.equal(digest(inlineCodeTokens(markdown)), inlineDigest, `${relative} changed inline code from the English source`);
    const actualNumbers = numericTokenCounts(markdown);
    for (const [token, minimum] of Object.entries(minimumNumbers)) {
      assert.ok(
        (actualNumbers[token] || 0) >= minimum,
        `${relative} lost numeric token ${token}: expected at least ${minimum}, found ${actualNumbers[token] || 0}`,
      );
    }
  }
});
