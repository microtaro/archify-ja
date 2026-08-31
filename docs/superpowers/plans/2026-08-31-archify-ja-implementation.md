# Archify 日本語派生版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 英語だけのArchify v2.16.0正本を確立し、そこから直接翻訳した日本語Skill `archify-ja` 2.16.0-ja.1を作る。

**Architecture:** 最初に`zh-CN`と中国語文書を除去した英語専用基準線を独立コミットにする。その後、公開識別を分離し、英語key・英語原文・日本語訳を追跡できる形で`ja-JP`、日本語文書、CLI、表示調整、配布物を追加する。

**Tech Stack:** Node.js ESM、JSON Schema Draft 2020-12、AJV、自己完結HTML/SVG、Node test runner、Chrome DevTools Protocol

**Spec:** `docs/superpowers/specs/2026-08-31-archify-ja-design.md`

## Global Constraints

- 翻訳元は英語だけ。`zh-CN`、中国語文書、暫定日本語、機械置換を翻訳元やfallbackに使わない。
- Task 1がGREENになるまで日本語を追加しない。
- 最終localeは`ja-JP`と`en`だけ。`zh-CN`は配布物から除去する。
- Repository `microtaro/archify-ja`、Skill `archify-ja`、version `2.16.0-ja.1`。
- 派生元`tt-a1i/archify` v2.16.0、commit `5de7275`、MIT表示を保持する。
- JSON field、CLI command/option、identifier、diagnostic codeは変更しない。
- authored contentは自動翻訳しない。
- 更新確認は無効化し、本家manifestへ通信しない。
- 外部仕様の長さ制限は維持し、英語表示幅由来の制限だけを実表示検査へ移す。
- Raven、DeepSeek Harness、独自site、更新配信基盤は初版対象外。
- GitHub作成、remote変更、push、tag、Releaseは明示承認まで行わない。

---

### Task 1: 英語だけの基準線

**Files:**
- Modify: `archify/test/i18n.test.mjs`, `archify/test/skill-metadata.test.mjs`
- Modify: `archify/schemas/common.schema.json`
- Modify: `archify/renderers/shared/i18n.mjs`, `archify/renderers/shared/utils.mjs`
- Modify: `archify/assets/template.html`, `archify/SKILL.md`, `README.md`
- Delete: `README_EN.md`, `README_ZH.md`, `docs/authoring-cookbook.zh-CN.md`
- Regenerate: `archify/renderers/shared/generated-validators.mjs`

**Interfaces:** Produces `SUPPORTED_LOCALES = ['en']`、`DEFAULT_LOCALE = 'en'`、英語だけでGREENのcommit。

- [ ] RED test: `SUPPORTED_LOCALES`、default、catalogが`en`だけで、全5形式が`zh-CN`をSchema拒否し、locale省略時は英語HTML/SVGになることを実行検査する。clean stageに中国語文書がないことも検査する。
- [ ] Run RED: `cd archify && node --test test/i18n.test.mjs test/skill-metadata.test.mjs`。`zh-CN`が残っている理由でFAILを確認する。
- [ ] Schema、catalog、中国語専用test、Skill案内から`zh-CN`を除去する。英語`README.md`を唯一の正本とし、重複英語READMEと中国語文書を削除する。日本語は追加しない。
- [ ] Run GREEN: `cd archify && npm run generate:validators && node --test test/i18n.test.mjs test/skill-metadata.test.mjs test/generate-validators.test.mjs && npm test`。全test PASSを確認する。
- [ ] Commit: `git commit -am "refactor: establish English-only Archify source"`。削除も含めるためcommit前に`git add -u`する。

### Task 2: 日本語版の公開識別

**Files:**
- Modify: `archify/test/release-identity.test.mjs`, `archify/test/update-notifier.test.mjs`
- Modify: `archify/package.json`, `archify/package-lock.json`, `archify/SKILL.md`, `archify/skill-release.json`, `archify/assets/template.html`
- Modify: `scripts/check-release-identity.mjs`, `scripts/package-smoke.mjs`, `scripts/stage-clean-skill.mjs`, `scripts/build-zip.sh`
- Delete: `docs/skill-updates/archify/stable.json`, `integrations/deepseek-harness/`

**Interfaces:** Consumes Task 1。Produces `archify-ja 2.16.0-ja.1`、repository URL、offline update、`archify-ja.zip`。

- [ ] RED test: package/lock/Skill/generator/releaseの正確な識別と、manifest URLなし・fetchなしでも`checkForUpdate()`がrequest 0件で`disabled`になる実挙動を書く。
- [ ] Run RED: `cd archify && node --test test/release-identity.test.mjs test/update-notifier.test.mjs test/skill-metadata.test.mjs`。
- [ ] Identityを変更し、manifest欠如をruntime判定より前にdisabled処理する。stage/ZIP rootを`archify-ja`へ変更し、対象外integrationと本家manifestを削除する。
- [ ] Run GREEN: 対象3 test後、`node scripts/stage-clean-skill.mjs --root "$PWD" --dest /tmp/archify-ja-stage/archify-ja`、`node scripts/package-smoke.mjs /tmp/archify-ja-stage/archify-ja`。
- [ ] Commit: `chore: establish archify-ja release identity`。

### Task 3: 英語Viewerから日本語Viewerへ直接翻訳

**Files:**
- Create: `archify/references/viewer-messages.ja-review.md`
- Modify: `archify/test/i18n.test.mjs`, `archify/schemas/common.schema.json`
- Modify: `archify/renderers/shared/i18n.mjs`, `archify/renderers/shared/utils.mjs`, `archify/assets/template.html`
- Regenerate: `archify/renderers/shared/generated-validators.mjs`

**Interfaces:** Consumes英語catalog。Produces `SUPPORTED_LOCALES = ['ja-JP','en']`、default `ja-JP`、全key日本語catalog、英日対照表。

- [ ] RED test: `en`と`ja-JP`の全key集合・補間変数集合一致、空文字・英語fallback・簡体字なしを検査する。対照表が`key | English source | Japanese`で全keyを1回含み、English列が実catalogと一致することも検査する。代表literalは`node.context.sequence = シーケンスの参加者`、`viewer.export.share = 共有`、到達不能文を固定する。
- [ ] Run RED: `cd archify && node --test test/i18n.test.mjs`。`ja-JP`不存在でFAIL。
- [ ] 英語catalogだけを見て全keyを直接日本語化する。中国語や旧暫定訳を参照しない。英日対照表へ全keyを記載し、categoryごとに精読する。自動翻訳・単語置換codeは作らない。
- [ ] Run GREEN: `cd archify && npm run generate:validators && node --test test/i18n.test.mjs test/generate-validators.test.mjs`。
- [ ] Commit: `feat: translate Viewer messages from English to Japanese`。

### Task 4: 英語CLIから日本語CLIへ直接翻訳

**Files:**
- Create: `archify/references/cli-messages.ja-review.md`
- Modify: `archify/test/cli.test.mjs`, `archify/test/repair-receipt.test.mjs`
- Modify: `archify/bin/archify.mjs`, `archify/renderers/shared/cli.mjs`, `archify/renderers/shared/i18n.mjs`

**Interfaces:** Consumes英語usage/diagnostic/fix。Produces日本語human strings。不変: JSON shape/code/command/option。

- [ ] RED test: 引数なし、unknown option、doctor、schema error、repair suggestionを実行し日本語を検査する。英日対照表と英語sourceの一致も検査する。
- [ ] Run RED: `cd archify && node --test test/cli.test.mjs test/repair-receipt.test.mjs`。
- [ ] 英語原文からhuman-facing文字列だけを直接翻訳する。path、code、command、option、numberを保持する。
- [ ] Run GREEN: `cd archify && node --test test/cli.test.mjs test/repair-receipt.test.mjs test/degraded.test.mjs`。
- [ ] Commit: `feat: translate CLI diagnostics from English to Japanese`。

### Task 5: 英語Skill文書から日本語文書へ直接翻訳

**Files:**
- Modify: `archify/SKILL.md`, `archify/references/*.md`
- Modify: `archify/schemas/README.md`, `archify/brand-marks/README.md`, `archify/renderers/*/README.md`
- Create: `archify/test/japanese-documentation.test.mjs`

**Interfaces:** Consumes Task 1英語文書。Produces日本語のSkill入口・参照契約。

- [ ] RED test: 1024byte description、relative link、事実非創作、検証後freeze、修正2回、repository evidence、意味削除禁止を操作契約として検査する。
- [ ] Run RED: `cd archify && node --test test/skill-metadata.test.mjs test/japanese-documentation.test.mjs`。
- [ ] 各英語文書から意味と強制力を保って直接翻訳する。中国語や旧暫定訳を参照しない。入口は簡潔にし、詳細を既存参照へ分離する。
- [ ] Run GREEN: 同じtestを再実行し、clean stageでも全link解決を確認する。
- [ ] Commit: `docs: translate Skill contracts from English to Japanese`。

### Task 6: 日本語表示幅と折返し

**Files:**
- Modify: `archify/test/layout-rules.test.mjs`, `archify/test/render-output-checks.test.mjs`
- Modify: `archify/renderers/shared/utils.mjs`, `text-fit.mjs`, `layout-report.mjs`
- Modify: `archify/scripts/check-render-output.mjs`, `archify/assets/template.html`, `archify/schemas/common.schema.json`
- Regenerate: `archify/renderers/shared/generated-validators.mjs`

**Interfaces:** Consumes `textUnits(text)`と日本語文言。Produces実表示幅による検証。

- [ ] RED test: ASCII/CJK幅、長い日本語label/note、URL/ID/maxItems維持、意味を削らないrepairを検査する。
- [ ] Run RED: `cd archify && node --test test/layout-rules.test.mjs test/render-output-checks.test.mjs`。
- [ ] 日本語を不当に拒否する`maxLength`だけを表示検査へ移し、他の安全制約を維持する。日本語font、`line-break: strict`、用途別wrapを実装する。
- [ ] Run GREEN: validator生成後、対象testとfreshness testを実行する。
- [ ] Commit: `feat: validate Japanese labels by rendered width`。

### Task 7: 英語READMEから日本語READMEと導入・削除手順へ

**Files:**
- Modify: `README.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `ROADMAP.md`, `CHANGELOG.md`
- Create: `docs/install-uninstall-evidence.md`, `archify/test/distribution-docs.test.mjs`

**Interfaces:** Consumes英語README、Task 2 identity、実skills CLI。Produces日本語READMEと4 Agent evidence。

- [ ] RED test: 非公式派生版、基準version/commit、非継続同期、MIT、4 Agent、install/remove、evidence対応を検査する。
- [ ] Run RED: `cd archify && node --test test/distribution-docs.test.mjs`。
- [ ] 隔離環境でCLI version/help、project/global install、list、path、remove、remove後不存在を実証する。正式removeがなければ実作成された`archify-ja` directoryだけを手動削除対象にする。
- [ ] 英語READMEから日本語READMEを直接作り、実証commandだけを掲載する。過去CHANGELOGは原文保持、先頭に日本語版entryを追加する。
- [ ] Run GREEN and commit: distribution docs + release identity tests。Commit `docs: add verified Japanese installation guide`。

### Task 8: 日本語exampleと実ブラウザ受入

**Files:**
- Create: `examples/ja/{web-app.architecture,agent-tool-call.workflow,cache-miss.sequence}.json`
- Create: `archify/test/japanese-examples.test.mjs`
- Create: `docs/acceptance/archify-ja-browser-acceptance.md`, `docs/acceptance/assets/*.{png,svg}`
- Generate: `examples/ja/*.html`

**Interfaces:** Produces日本語3形式source、artifact、browser/export evidence。

- [ ] RED test: `ja-JP`、日本語title/node/relationship、showcase 9 checks、composition 0/0、主要Viewer日本語を検査する。fixture不存在でREDを確認する。
- [ ] 英語exampleはfield shapeだけ参照し、日本語EC注文、変更承認、cache missを新規authorする。
- [ ] 3形式を`--quality showcase --json`でvalidate/deliverしGREENにする。
- [ ] 1440x900/narrow、light/dark、Finder、Route、Export、keyboard、ARIA、console、PNG/SVGを実ブラウザ確認し記録する。
- [ ] Commit: `test: add Japanese browser acceptance artifacts`。

### Task 9: clean ZIPと全回帰

**Files:**
- Modify: `scripts/package-smoke.mjs`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`
- Modify: `archify/test/clean-skill-staging.test.mjs`, `archify/test/release-package-gates.test.mjs`
- Generate: `archify-ja.zip`

**Interfaces:** Produces中国語を含まない決定論的release candidate。

- [ ] RED test: ZIP root、identity、日本語文書/example、更新URLなし、中国語catalog/document/DeepSeekなしを実archiveで検査する。
- [ ] Run RED: package gate tests。旧ZIP/CI参照を`archify-ja.zip`へ修正する。
- [ ] Run full: `cd archify && npm test; cd .. && bash scripts/build-zip.sh && node scripts/package-smoke.mjs archify-ja.zip && git diff --check`。
- [ ] ZIPから4 Agentへinstall/removeを再実証し、README/evidenceと一致させる。
- [ ] Commit: `build: prepare archify-ja release candidate`。

### Task 10: 公開（明示承認後のみ）

**Files:** External `microtaro/archify-ja`、Release `v2.16.0-ja.1`。

- [ ] Read-only preflight: clean status、commit log、ZIP SHA-256。
- [ ] Repository作成、remote追加、push、tag、Release、公開URL検証を列挙し、ユーザーの明示承認を得る。
- [ ] 承認後だけ本家履歴を保持して公開し、既存`origin`を破壊的に上書きしない。
- [ ] 公開URLから4 Agentのinstall/remove、本家`archify`との同居を再検証する。
- [ ] Repository URL、Release URL、tag、OID、SHA-256、対応Agent、未対応範囲を報告する。
