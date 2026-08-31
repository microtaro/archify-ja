# Remove Chinese bilingual localization report

## Status

- Result: GREEN. Public renderer locale, scenario data, and generated product site are English-only.
- Base: `b6dd629` (`README_ZH.md` and the Chinese cookbook were already deleted).
- Scope rule: retained English copy verbatim; removed only Chinese locale branches, copy, signals, links, switch UI, query/storage runtime, and tests that required those surfaces.
- Preserved out-of-scope CJK evidence: width/Unicode fixtures, authored non-English content fixtures, and brand aliases such as WeChat.

## TDD evidence

### RED

Command:

```text
cd archify && node --test test/english-only-localization.test.mjs
```

Observed: 4 tests, 0 pass, 4 fail. Failures were caused by the existing `zh-CN` renderer locale, scenario `zh` copy, generated `data-zh` site output, and `README_ZH.md` links.

### GREEN

Command:

```text
cd archify && node --test test/guide.test.mjs test/landing.test.mjs test/english-only-localization.test.mjs
```

Observed: 14 tests, 14 pass, 0 fail.

Final full suite (executed exactly once):

```text
cd archify && npm test
```

Observed: generator freshness, release identity, golden renders, then 1006 tests: 978 pass, 0 fail, 28 explicit skips.

## Generation commands

```text
cd archify && node scripts/generate-validators.mjs
cd .. && node scripts/build-index.mjs docs/index.html
node scripts/build-guide.mjs docs/guide.html
node scripts/build-start.mjs docs/start.html
node scripts/build-gallery.mjs docs
```

The Gallery build regenerated 11 artifacts and completed 99/99 structural checks. `docs/index.html`, `docs/gallery.html`, `docs/guide.html`, and `docs/start.html` were generated from `scripts/*-template.html` and the canonical builders; they were not hand-edited.

## Files

- Renderer/data/schema: `archify/renderers/shared/i18n.mjs`, `archify/recipes/scenarios.mjs`, `archify/schemas/common.schema.json`, generated `archify/renderers/shared/generated-validators.mjs`.
- Site source/build: `scripts/index-template.html`, `scripts/build-index.mjs`, `scripts/gallery-template.html`, `scripts/build-gallery.mjs`, `scripts/guide-template.html`, `scripts/start-template.html`, `scripts/build-start.mjs`, `scripts/site-copy.mjs`, `scripts/copy-site-assets.mjs`.
- Site output/runtime: `docs/index.html`, `docs/gallery.html`, `docs/guide.html`, `docs/start.html`; removed `docs/assets/site-language.js`.
- README/release: `README.md`, `README_EN.md`, `scripts/check-release-identity.mjs`.
- Tests: added `archify/test/english-only-localization.test.mjs`; removed the two site-language tests; updated locale-, generated-site-, release-, README-, guide-, start-, landing-, gallery-, and CLI-related expectations.
- Package scripts: added `build:index`; retained `test:webm` identifier while removing its deleted site-language test dependency.

## English byte-preservation audit

Before production edits, normalized JSON containing all 518 English renderer messages, all recipe English copy/start prompts/English signals, and all English site type labels was written to `/tmp/archify-remove-chinese-en-baseline.json`.

Before/after result:

```text
SHA-256 3bda1658738a39f8b3e16568ff26eaaf3ce5c405d8f796e7395b59ed5ab52523
bytes   41195
match   exact
```

README English mirrors remain byte-identical to each other. Their only change is deletion of the separator and deleted Chinese README link after the retained `<strong>English</strong>` label.

## Concerns and boundaries

- Per the explicit no-English-rewrite constraint, existing English documentation sentences in `README.md`, `README_EN.md`, `archify/SKILL.md`, `archify/references/authoring-contract.md`, and `archify/schemas/README.md` that describe the historical `zh-CN` option were not rewritten. Runtime/schema/site behavior is English-only, so those English prose references are now stale and require a separately authorized English documentation edit.
- CJK text still present in width/Unicode/layout/browser fixtures, authored-content fallback coverage, brand aliases, and release-design evidence is intentionally retained and is not a product Chinese locale.
- Real Chrome-only tests remained explicitly skipped because `ARCHIFY_CHROME` was not configured; non-browser generated/runtime tests passed.
