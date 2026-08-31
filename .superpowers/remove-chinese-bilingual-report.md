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

README English mirrors remain byte-identical to each other. The initial change deleted the separator and deleted Chinese README link after the retained `<strong>English</strong>` label; the authorized follow-up also deleted `|zh-CN` from the locale contract while preserving the rest of that English sentence.

## Concerns and boundaries

- Packaged source-of-truth documentation now matches the English-only runtime and schema contract. Historical/spec material and explicit `zh-CN` rejection fixtures remain outside the product-facing residual audit.
- CJK text still present in width/Unicode/layout/browser fixtures, authored-content fallback coverage, brand aliases, and release-design evidence is intentionally retained and is not a product Chinese locale.
- Real Chrome-only tests remained explicitly skipped because `ARCHIFY_CHROME` was not configured; non-browser generated/runtime tests passed.

## Follow-up completion audit

The completion audit found one product-facing contract leak in both English README mirrors and one dead site-control CSS rule.

### RED

```text
cd archify && node --test --test-name-pattern="product-facing source" test/english-only-localization.test.mjs
```

Observed: 1 test, 0 pass, 1 fail. `README.md` still contained `meta.locale=en|zh-CN`. The same audit inventory also exposed the unused `.btn-lang` navigation rule.

### GREEN

- Changed both README mirrors to the English-only `meta.locale=en` contract without altering the remainder of the sentence.
- Removed the unused `.btn-lang` and hover CSS blocks from `docs/assets/site-navigation.css`.
- Added a bounded product-facing residual audit across README mirrors, site templates/build sources, shared site CSS, and the four generated docs pages. It rejects `README_ZH`, `data-zh`, `btn-lang`, `中文`, `zh-CN`, language runtime/storage assets, and zh URL/query branches. Rejection fixtures, history/spec documents, and CJK safety fixtures are not scanned.

Focused command:

```text
cd archify && node --test test/english-only-localization.test.mjs test/landing.test.mjs test/gallery.test.mjs test/readme-showcase.test.mjs test/release-identity.test.mjs
```

Observed: 33 tests, 33 pass, 0 fail, 0 skip.

## Review fix round

Three Important review findings were handled without rerunning the already-green full suite.

### 1. Packaged locale source of truth

RED command:

```text
cd archify && node --test --test-name-pattern="product-facing source|language behavior" test/english-only-localization.test.mjs test/skill-metadata.test.mjs
```

Observed failures: `archify/SKILL.md`, `archify/references/authoring-contract.md`, and `archify/schemas/README.md` still advertised `zh-CN` support.

GREEN: those three source-of-truth documents now describe `en` as the only Viewer locale, retain non-English authored-content fallback guidance, and contain no `zh-CN` product contract. They are included in the bounded product-facing residual audit.

### 2. Scenario English output preservation

RED: the new behavior test expected the original error `Scenario recipe "system-overview" does not define a en start prompt.` but received the rewritten `does not define an English start prompt.`

GREEN: `startPromptsFor` again derives the error from `language = 'en'`. The test also locks every English start prompt and repository prompt to the pre-removal byte digest:

```text
d7c6063a82f140325db918672f67e0eafe51aa89434f9c086e6139d15f14128f
```

The digest was independently reproduced from base `b6dd629`.

### 3. English navigation continuity coverage

Restored `archify/test/site-navigation-continuity.test.mjs` as an English-only suite and `archify/test/site-navigation-integration.mjs` as the serialized builder/browser gate. `test:webm` again runs that integration gate.

Coverage restored:

- shared Guide / Proof Lab / Start links, Install CTA, page identities, and canonical navigation CSS;
- desktop and mobile CSS geometry contracts;
- Gallery English labels, filter selection, URL persistence, and responsive controls;
- Guide English labels and filter selection;
- all four custom site builders emitting canonical navigation CSS and English navigation;
- optional real Chrome traversal, reload persistence, CTA/navigation, filtering, and 1440x900 / 390x844 geometry.

Mutation RED: temporarily changing the Gallery Guide target to `guide-missing.html` produced 1/1 FAIL with `scripts/gallery-template.html: Guide link missing`; the mutation was immediately reverted. Integration GREEN: 6 pass, 0 fail, 1 Chrome skip.

Final focused command:

```text
cd archify && node --test test/english-only-localization.test.mjs test/skill-metadata.test.mjs test/guide.test.mjs test/start-page.test.mjs test/site-navigation-integration.mjs
```

Observed: 32 tests, 31 pass, 0 fail, 1 explicit Chrome skip. Full `npm test` was not rerun per review instruction.
