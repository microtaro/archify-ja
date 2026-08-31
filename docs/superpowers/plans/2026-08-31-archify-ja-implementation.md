# Archify 日本語派生版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Archify v2.16.0を基に、日本語で導入、作図、検証、修正、削除まで完結できる独立Skill `archify-ja` 2.16.0-ja.1を作る。

**Architecture:** 型付きJSON IR、CLI名、機械可読な診断コードは維持し、公開識別、日本語ロケール、Viewer/CLI文言、日本語執筆契約、配布物を分離する。ソースの`archify/`ディレクトリは維持し、Skill metadataとステージング先・ZIP名を`archify-ja`にすることで本家との同時導入を可能にする。

**Tech Stack:** Node.js ESM、JSON Schema Draft 2020-12、AJV生成validator、自己完結HTML/SVG、Node test runner、Chrome DevTools Protocol

**Spec:** `docs/superpowers/specs/2026-08-31-archify-ja-design.md`

## Global Constraints

- 公開先は`microtaro/archify-ja`、Skill IDは`archify-ja`、初版は`2.16.0-ja.1`とする。
- 派生元`tt-a1i/archify` v2.16.0、commit `5de7275`とMIT著作権表示を保持する。
- 本家への継続追従を保証しない日本語スナップショット派生版と明記する。
- JSONフィールド名、CLIサブコマンド、CLIオプション、JavaScript識別子、診断コードは変更しない。
- 日本語版の既定ロケールは`ja-JP`とし、明示された`en`と`zh-CN`も維持する。
- authored contentは自動翻訳しない。
- 更新確認は初版では無効化し、本家の更新マニフェストへ通信しない。
- `description`の1024文字・1024バイト制限など外部仕様の制限は維持する。
- 英語由来の短文化で意味を削らず、表示幅、折返し、余白、図の分割を先に直す。
- RavenとDeepSeek Harness、独自Webサイト、独自更新配信基盤は初版対象外とする。
- GitHubリポジトリ作成、remote変更、push、Release作成は別途ユーザー承認を得るまで実行しない。

---

### Task 1: 派生版の公開識別とオフライン更新契約

**Files:**
- Modify: `archify/test/release-identity.test.mjs`
- Modify: `archify/test/update-notifier.test.mjs`
- Modify: `archify/test/skill-metadata.test.mjs`
- Modify: `archify/package.json`
- Modify: `archify/package-lock.json`
- Modify: `archify/SKILL.md`
- Modify: `archify/skill-release.json`
- Modify: `archify/assets/template.html`
- Modify: `scripts/check-release-identity.mjs`
- Modify: `scripts/package-smoke.mjs`
- Modify: `scripts/stage-clean-skill.mjs`
- Modify: `scripts/build-zip.sh`
- Delete: `docs/skill-updates/archify/stable.json`
- Delete: `integrations/deepseek-harness/`

**Interfaces:**
- Consumes: 現在のrelease identity検査、clean-skill staging、update checker。
- Produces: package version `2.16.0-ja.1`、Skill ID `archify-ja`、generator `archify-ja 2.16.0-ja.1`、ネットワーク更新先を持たないrelease contract、`archify-ja.zip`。

- [ ] **Step 1: 公開識別と更新無効化のREDテストを書く**

`archify/test/release-identity.test.mjs`へ、package、Skill metadata、template generator、release metadataが次を満たす検査を追加する。

```js
assert.equal(packageJson.name, 'archify-ja');
assert.equal(packageJson.version, '2.16.0-ja.1');
assert.match(skill, /^name: archify-ja$/m);
assert.match(template, /<meta name="generator" content="archify-ja 2\.16\.0-ja\.1">/);
assert.equal(release.updateManifestUrl, undefined);
assert.equal(release.source.repository, 'https://github.com/microtaro/archify-ja');
```

`archify/test/update-notifier.test.mjs`へ、release metadataに更新URLがない場合はfetchを一度も呼ばず`disabled`を返す検査を追加する。

```js
assert.deepEqual(await checkForUpdate(optionsWithoutManifest), { status: 'disabled' });
assert.equal(requests.length, 0);
```

- [ ] **Step 2: REDを確認する**

Run: `cd archify && node --test test/release-identity.test.mjs test/update-notifier.test.mjs test/skill-metadata.test.mjs`

Expected: `archify`、`2.16.0`、本家manifest URLが残っているためFAIL。

- [ ] **Step 3: 最小限の識別変更を実装する**

`archify/package.json`とlockfileを`archify-ja` / `2.16.0-ja.1`へ変更する。`archify/SKILL.md`のfrontmatter名とversion、template generator、`skill-release.json`のrepositoryを日本語版へ変更し、`updateManifestUrl`を削除する。

更新checkerはURL欠如を正常な無効状態として扱う。

```js
if (!release.updateManifestUrl) return { status: 'disabled' };
```

release identity検査はSemVer prerelease `ja.1`を許可し、日本語版repositoryを唯一の配布元として検査する。ステージング先とZIP名を`archify-ja`へ変更する。初版対象外のDeepSeek Harness一式と本家stable manifestを削除する。

- [ ] **Step 4: 対象テストと配布ステージをGREENにする**

Run: `cd archify && node --test test/release-identity.test.mjs test/update-notifier.test.mjs test/skill-metadata.test.mjs`

Expected: PASS。続けて `node scripts/stage-clean-skill.mjs /tmp/archify-ja-stage` を実行し、`/tmp/archify-ja-stage/archify-ja/SKILL.md`が存在することを確認する。

- [ ] **Step 5: コミットする**

```bash
git add archify scripts docs/skill-updates integrations/deepseek-harness
git commit -m "chore: establish archify-ja release identity"
```

### Task 2: `ja-JP`ロケールと日本語Viewerカタログ

**Files:**
- Modify: `archify/test/i18n.test.mjs`
- Modify: `archify/schemas/common.schema.json`
- Modify: `archify/renderers/shared/i18n.mjs`
- Modify: `archify/renderers/shared/utils.mjs`
- Modify: `archify/assets/template.html`
- Regenerate: `archify/renderers/shared/generated-validators.mjs`

**Interfaces:**
- Consumes: `resolveLocale(locale)`, `translateMessage(locale, key, values)`, `translateCount(locale, key, count, values)`。
- Produces: `SUPPORTED_LOCALES = ['ja-JP', 'en', 'zh-CN']`、`DEFAULT_LOCALE = 'ja-JP'`、全Viewer keyを含む日本語catalog。

- [ ] **Step 1: `ja-JP`ロケールのREDテストを書く**

`archify/test/i18n.test.mjs`で全5形式を対象に次を検査する。

```js
assert.deepEqual(SUPPORTED_LOCALES, ['ja-JP', 'en', 'zh-CN']);
assert.equal(resolveLocale(undefined), 'ja-JP');
assert.equal(translateMessage('ja-JP', 'viewer.finder.title'), 'ノードを検索');
assert.equal(translateMessage('ja-JP', 'viewer.route.start'), '経路を選択');
assert.equal(translateCount('ja-JP', 'viewer.route.hop', 2), '2 ホップ');
assert.match(result.html, /^<!DOCTYPE html>\n<html lang="ja-JP"/);
assert.match(result.html, /<svg\b[^>]*\blang="ja-JP"/);
```

日本語タイトル、ノード、関係ラベルが出力後も同一であることもdeepEqualで確認する。

- [ ] **Step 2: REDを確認する**

Run: `cd archify && node --test test/i18n.test.mjs`

Expected: `ja-JP`が未対応で既定値が`en`のためFAIL。

- [ ] **Step 3: Schemaと日本語catalogを実装する**

`common.schema.json#/$defs/locale`を次へ変更する。

```json
{ "enum": ["ja-JP", "en", "zh-CN"] }
```

`i18n.mjs`は既存の全message keyに対して日本語文字列を同じ順序で追加する。置換変数`{label}`、`{count}`、`{source}`、`{target}`は保持する。`DEFAULT_LOCALE`を`ja-JP`へ変更し、catalog completeness検査を3ロケールで通す。

- [ ] **Step 4: validatorを再生成しGREENを確認する**

Run: `cd archify && npm run generate:validators && node --test test/i18n.test.mjs test/generate-validators.test.mjs`

Expected: PASS。`generated-validators.mjs`に`ja-JP`が含まれ、手編集差分がない。

- [ ] **Step 5: コミットする**

```bash
git add archify/schemas/common.schema.json archify/renderers/shared/i18n.mjs archify/renderers/shared/utils.mjs archify/renderers/shared/generated-validators.mjs archify/assets/template.html archify/test/i18n.test.mjs
git commit -m "feat: add complete Japanese viewer locale"
```

### Task 3: 日本語CLIと診断メッセージ

**Files:**
- Modify: `archify/test/cli.test.mjs`
- Modify: `archify/test/repair-receipt.test.mjs`
- Modify: `archify/bin/archify.mjs`
- Modify: `archify/renderers/shared/cli.mjs`
- Modify: `archify/renderers/shared/i18n.mjs`

**Interfaces:**
- Consumes: `translateMessage`、既存diagnosticsの`code`, `subject`, `evidence`, `supportedFixes`。
- Produces: 日本語usageと人間向け診断文。diagnostic codeとJSON field shapeは不変。

- [ ] **Step 1: CLIのREDテストを書く**

`archify/test/cli.test.mjs`に引数なし、未知オプション、doctor成功を追加し、stderr/stdoutへ次が現れることを検査する。

```js
assert.match(result.stderr, /使い方: archify/);
assert.match(result.stderr, /不明なオプション/);
assert.match(doctor.stdout, /Archify 日本語版の準備ができています/);
```

`repair-receipt.test.mjs`ではJSON shapeとcodeが同一のまま、`supportedFixes`が日本語になることを検査する。

```js
assert.equal(repair.code, 'schema/additionalProperties');
assert.deepEqual(repair.supportedFixes, ['未対応のプロパティ "unexpected" を削除する']);
```

- [ ] **Step 2: REDを確認する**

Run: `cd archify && node --test test/cli.test.mjs test/repair-receipt.test.mjs`

Expected: 英語usageと英語修正候補のためFAIL。

- [ ] **Step 3: 利用者向けCLI文言を日本語化する**

usage、option error、doctor、成功要約、repair mappingを日本語化する。コマンド名、オプション、ファイルパス、数値、diagnostic codeは翻訳しない。JSON modeでもキーは変更せず、人間向け文字列値だけを日本語化する。

- [ ] **Step 4: CLI回帰テストをGREENにする**

Run: `cd archify && node --test test/cli.test.mjs test/repair-receipt.test.mjs test/degraded.test.mjs`

Expected: PASS。依存なしのinstalled-skill simulationも日本語版識別で動作する。

- [ ] **Step 5: コミットする**

```bash
git add archify/bin/archify.mjs archify/renderers/shared/cli.mjs archify/renderers/shared/i18n.mjs archify/test/cli.test.mjs archify/test/repair-receipt.test.mjs
git commit -m "feat: localize archify-ja CLI diagnostics"
```

### Task 4: 日本語の文字幅・折返し・制約契約

**Files:**
- Modify: `archify/test/layout-rules.test.mjs`
- Modify: `archify/test/render-output-checks.test.mjs`
- Modify: `archify/test/skill-metadata.test.mjs`
- Modify: `archify/renderers/shared/utils.mjs`
- Modify: `archify/renderers/shared/text-fit.mjs`
- Modify: `archify/renderers/shared/layout-report.mjs`
- Modify: `archify/scripts/check-render-output.mjs`
- Modify: `archify/assets/template.html`
- Modify: `archify/schemas/common.schema.json`
- Modify: `archify/schemas/architecture.schema.json`
- Regenerate: `archify/renderers/shared/generated-validators.mjs`

**Interfaces:**
- Consumes: 現在のラベル計測、CJK ASCII-unit計算、composition diagnostics。
- Produces: 既存の`textUnits(text)`を共通利用する日本語の折返し・衝突判定。意味を削る固定文字数制限への非依存。

- [ ] **Step 1: 日本語幅のREDテストを書く**

日本語とASCIIの幅単位を固定する。

```js
assert.equal(textUnits('API'), 3);
assert.equal(textUnits('認証API'), 7);
assert.equal(textUnits('注文を確定して在庫を引き当てる'), 30);
```

48文字を超える日本語guided-view labelと140文字を超えるnoteが、文字数だけでは拒否されず、生成後のcomposition検査で表示可否を判断されるfixtureを追加する。同時にURL、ID、配列件数など安全性上の上限は従来どおり拒否されることを検査する。

- [ ] **Step 2: REDを確認する**

Run: `cd archify && node --test test/layout-rules.test.mjs test/render-output-checks.test.mjs test/skill-metadata.test.mjs`

Expected: 日本語長文がSchema `maxLength`で拒否されるか、幅計算が一致せずFAIL。

- [ ] **Step 3: 言語依存の文字数制限を表示検査へ移す**

guided view label/note、evidence labelなど、意味のある日本語を不当に拒否する`maxLength`を削除する。URL長、ID形式、maxItems、geometry数値制限は維持する。既存の`textUnits`を唯一の幅単位関数として使い、CJK、全角記号、かな、漢字を2単位、ASCIIを1単位として計算する。

templateの日本語font stackを次で始め、既存のsystem fallbackを続ける。

```css
font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", "Yu Gothic", Meiryo, system-ui, sans-serif;
```

`line-break: strict`、`overflow-wrap: anywhere`はカード本文に限定し、短いノードラベルには単語途中の強制分割を適用しない。

- [ ] **Step 4: validator再生成と対象テストをGREENにする**

Run: `cd archify && npm run generate:validators && node --test test/layout-rules.test.mjs test/render-output-checks.test.mjs test/skill-metadata.test.mjs test/generate-validators.test.mjs`

Expected: PASS。長い日本語がSchema段階で意味なく拒否されず、表示不能な場合はcomposition diagnosticになる。

- [ ] **Step 5: コミットする**

```bash
git add archify/assets/template.html archify/schemas archify/renderers/shared archify/test/layout-rules.test.mjs archify/test/render-output-checks.test.mjs archify/test/skill-metadata.test.mjs
git commit -m "feat: validate Japanese labels by rendered width"
```

### Task 5: Skill入口と参照文書の日本語化

**Files:**
- Modify: `archify/SKILL.md`
- Modify: `archify/references/authoring-contract.md`
- Modify: `archify/references/delivery-contract.md`
- Modify: `archify/references/viewer-runtime.md`
- Modify: `archify/references/brand-marks.md`
- Modify: `archify/schemas/README.md`
- Modify: `archify/brand-marks/README.md`
- Modify: `archify/renderers/dataflow/README.md`
- Modify: `archify/renderers/lifecycle/README.md`
- Modify: `archify/renderers/sequence/README.md`
- Modify: `archify/renderers/workflow/README.md`
- Modify: `archify/test/skill-metadata.test.mjs`
- Create: `archify/test/japanese-documentation.test.mjs`

**Interfaces:**
- Consumes: 本家の安全契約とTask 1〜4で確定したSkill ID、locale、表示制約。
- Produces: 日本語利用者が保守できる入口文書と参照文書。literal relative linkはすべて配布Skill内で解決する。

- [ ] **Step 1: 文書契約のREDテストを書く**

`japanese-documentation.test.mjs`で全対象Markdownを読み、次を検査する。

```js
assert.match(skill, /^name: archify-ja$/m);
assert.ok(Buffer.byteLength(description, 'utf8') <= 1024);
assert.match(skill, /日本語/);
assert.match(skill, /検証後.*変更しない/);
assert.match(authoring, /事実.*創作しない/);
assert.match(authoring, /文字数だけを理由に.*削らない/);
assert.match(delivery, /実際のHTML.*ブラウザ/);
```

全Markdownの相対リンクを解決し、不存在なら失敗させる。

- [ ] **Step 2: REDを確認する**

Run: `cd archify && node --test test/skill-metadata.test.mjs test/japanese-documentation.test.mjs`

Expected: 英語文書と旧Skill IDのためFAIL。

- [ ] **Step 3: 文書を意味単位で日本語化する**

規則の強度、禁止事項、2回までの修正、検証後freeze、repository evidence、ブランドの明示性を保持して翻訳する。frontmatter descriptionは1024バイト以内の自然な日本語にする。入口は読みやすさを保ち、詳細を既存4参照へ分離する。英語固有の「shorten」を、意味保持、レイアウト修正優先、短縮は最後という契約へ置き換える。

- [ ] **Step 4: 文書契約をGREENにする**

Run: `cd archify && node --test test/skill-metadata.test.mjs test/japanese-documentation.test.mjs`

Expected: PASS。全literal relative linkがclean staged skillでも解決する。

- [ ] **Step 5: コミットする**

```bash
git add archify/SKILL.md archify/references archify/schemas/README.md archify/brand-marks/README.md archify/renderers archify/test/skill-metadata.test.mjs archify/test/japanese-documentation.test.mjs
git commit -m "docs: translate archify-ja authoring contracts"
```

### Task 6: 日本語README、導入・削除手順、派生元表示

**Files:**
- Modify: `README.md`
- Delete: `README_EN.md`
- Delete: `README_ZH.md`
- Modify: `LICENSE`
- Modify: `CONTRIBUTING.md`
- Modify: `SECURITY.md`
- Modify: `ROADMAP.md`
- Modify: `CHANGELOG.md`
- Create: `docs/install-uninstall-evidence.md`
- Modify: `archify/test/readme-showcase.test.mjs`
- Create: `archify/test/distribution-docs.test.mjs`

**Interfaces:**
- Consumes: 検証済みSkill IDとステージング構造。
- Produces: Codex、Cursor、Claude Code、OpenCodeの導入、確認、更新、削除を対にした日本語READMEと、コマンド実証記録。

- [ ] **Step 1: 配布文書のREDテストを書く**

```js
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractInstallAndRemovalCommands(markdown) {
  return [...markdown.matchAll(/^npx skills .+archify-ja.*$/gm)].map((match) => match[0]);
}

assert.match(readme, /非公式の日本語派生版/);
assert.match(readme, /Archify v2\.16\.0/);
assert.match(readme, /5de7275/);
for (const agent of ['codex', 'cursor', 'claude-code', 'opencode']) {
  assert.match(readme, new RegExp(`--agent ${agent}`));
}
assert.match(readme, /アンインストール/);
for (const command of extractInstallAndRemovalCommands(readme)) {
  assert.match(evidence, new RegExp(escapeRegExp(command)));
}
assert.match(license, /Copyright \(c\) 2026 tt-a1i \(Archify\)/);
```

- [ ] **Step 2: REDを確認する**

Run: `cd archify && node --test test/readme-showcase.test.mjs test/distribution-docs.test.mjs`

Expected: 本家READMEのままなのでFAIL。

- [ ] **Step 3: 隔離環境でskills CLIの実際の操作を確認する**

一時ディレクトリを作り、`npx skills --help`、`npx skills add --help`、利用可能なら削除サブコマンドのhelpを保存する。ローカルパスから各Agentへproject/global相当の導入を行い、配置先と一覧表示を記録する。削除コマンドが存在する場合は削除後の不存在まで確認する。存在しない場合は、実際に作成された`archify-ja`ディレクトリだけを手動削除対象として記録する。

Evidence fileには、CLI version、実行コマンド、exit code、作成先、削除後の確認結果を記載する。ホームディレクトリ全体や未解決globを削除対象にしない。

- [ ] **Step 4: 日本語READMEと運用文書を書く**

README冒頭に非公式派生版、基準version/commit、非継続同期、MITを明記する。各Agentについて「グローバル導入」「プロジェクト導入」「確認」「再導入」「アンインストール」を同じ順で掲載し、Step 3で成功したコマンドだけを使う。Raven、DeepSeek Harness、独自更新通知が初版対象外であることを記載する。

CHANGELOGは過去記録を原文のまま残し、先頭に`2.16.0-ja.1`の日本語派生版エントリを追加する。

- [ ] **Step 5: 文書テストをGREENにする**

Run: `cd archify && node --test test/readme-showcase.test.mjs test/distribution-docs.test.mjs test/release-identity.test.mjs`

Expected: PASS。READMEの全コマンドがevidence fileの成功記録と対応する。

- [ ] **Step 6: コミットする**

```bash
git add README.md README_EN.md README_ZH.md LICENSE CONTRIBUTING.md SECURITY.md ROADMAP.md CHANGELOG.md docs/install-uninstall-evidence.md archify/test
git commit -m "docs: publish Japanese installation and removal guide"
```

### Task 7: 日本語サンプルと実ブラウザ検証

**Files:**
- Create: `examples/ja/web-app.architecture.json`
- Create: `examples/ja/agent-tool-call.workflow.json`
- Create: `examples/ja/cache-miss.sequence.json`
- Create: `archify/test/japanese-examples.test.mjs`
- Create: `docs/acceptance/archify-ja-browser-acceptance.md`
- Generate: `examples/ja/*.html`
- Generate: `docs/acceptance/assets/*.png`
- Generate: `docs/acceptance/assets/*.svg`

**Interfaces:**
- Consumes: 全5形式rendererの共通`ja-JP` ViewerとTask 4の日本語表示規則。
- Produces: 日本語Architecture、Workflow、Sequenceの型付きsource、検証済みHTML、PNG/SVG、実ブラウザ受入記録。

- [ ] **Step 1: 日本語サンプルのREDテストを書く**

3つのsourceに`meta.locale: "ja-JP"`、日本語title、10文字以上の日本語node label、日本語relationship labelを要求する。各sourceを`showcase`品質でvalidateし、生成HTMLの`lang`と主要UI文言を検査する。

```js
assert.equal(source.meta.locale, 'ja-JP');
assert.ok(source.meta.title.length >= 4);
assert.equal(validation.composition.summary.errors, 0);
assert.equal(validation.composition.summary.warnings, 0);
assert.match(html, /ノードを検索/);
```

- [ ] **Step 2: REDを確認する**

Run: `cd archify && node --test test/japanese-examples.test.mjs`

Expected: fixture不存在のためFAIL。

- [ ] **Step 3: 3形式の日本語sourceを作る**

既存exampleはfield shapeだけの参考とし、title、stable ID、domain wording、配置を新規に作る。Architectureは日本語ECの注文経路、Workflowは変更承認、Sequenceはキャッシュミスを題材にし、英語サンプルの直訳にしない。

- [ ] **Step 4: validateとdeliverをGREENにする**

Run:

```bash
cd archify
node bin/archify.mjs validate architecture ../examples/ja/web-app.architecture.json --quality showcase --json
node bin/archify.mjs validate workflow ../examples/ja/agent-tool-call.workflow.json --quality showcase --json
node bin/archify.mjs validate sequence ../examples/ja/cache-miss.sequence.json --quality showcase --json
node --test test/japanese-examples.test.mjs
```

Expected: 各receiptが9 artifact checks、composition 0 errors / 0 warnings。

- [ ] **Step 5: wide/narrowと出力形式を実ブラウザで確認する**

`visual-check`で1440×900と狭幅を取得し、ChromeでFinder、Route、theme、Export、keyboard focusを操作する。Architecture、Workflow、Sequenceのlight/dark PNGとSVGを出力し、文字化け、切れ、重なり、不自然な途中改行、console errorがないことを受入記録へ具体的に記載する。

Data FlowとLifecycleは`i18n.test.mjs`の実Chrome検査で日本語UIを確認する。形式固有の問題が見つかった場合は該当sourceを追加して再検査する。

- [ ] **Step 6: コミットする**

```bash
git add examples/ja archify/test/japanese-examples.test.mjs docs/acceptance
git commit -m "test: add Japanese artifact acceptance set"
```

### Task 8: クリーン配布物と全体回帰

**Files:**
- Modify: `scripts/package-smoke.mjs`
- Modify: `archify/test/clean-skill-staging.test.mjs`
- Modify: `archify/test/release-package-gates.test.mjs`
- Generate: `archify-ja.zip`

**Interfaces:**
- Consumes: `scripts/stage-clean-skill.mjs`が作る`archify-ja/`、Task 1〜7の全契約。
- Produces: checkout外でdoctor、validate、deliverできる決定論的`archify-ja.zip`。

- [ ] **Step 1: 配布ゲートのREDテストを書く**

staged root名、ZIP root名、Skill metadata、generator、更新URL不存在、日本語README/参照、日本語example同梱、対象外integration不存在を検査する。

```js
assert.equal(entries[0].startsWith('archify-ja/'), true);
assert.equal(entries.some((entry) => entry.startsWith('archify/')), false);
assert.equal(entries.includes('archify-ja/SKILL.md'), true);
assert.equal(entries.some((entry) => entry.includes('deepseek-harness')), false);
assert.equal(packagedRelease.updateManifestUrl, undefined);
```

- [ ] **Step 2: REDを確認する**

Run: `cd archify && node --test test/clean-skill-staging.test.mjs test/release-package-gates.test.mjs`

Expected: 現在の`archify` stage/ZIP識別が残っていればFAIL。

- [ ] **Step 3: package smokeとZIP buildを日本語版へ合わせる**

package smokeのfixture repository、version、generator、root directoryを日本語版へ変更する。更新manifestを前提とするgateは削除し、更新機能がdisabledで通信しないgateへ置き換える。ZIPはmtime、entry order、permissionを固定した既存の決定論的writerを維持する。

- [ ] **Step 4: 全テストとクリーンZIP smokeを実行する**

Run:

```bash
cd archify
npm test
cd ..
bash scripts/build-zip.sh
node scripts/package-smoke.mjs archify-ja.zip
git diff --check
```

Expected: 全テストPASS、package smoke PASS、`archify-ja.zip`だけが生成される。既存テストに基準由来の失敗がある場合は、今回の変更による失敗と分離して正確に報告し、無関係なテストを書き換えない。

- [ ] **Step 5: Release候補をローカル導入して削除まで再確認する**

Task 6と同じ隔離環境で、checkoutではなく`archify-ja.zip`を入力としてCodex、Cursor、Claude Code、OpenCodeの導入・一覧・削除を再実行する。READMEのコマンドと差があればREADMEとevidenceを修正して文書テストを再実行する。

- [ ] **Step 6: 最終コミットを作る**

```bash
git add scripts/package-smoke.mjs archify/test/clean-skill-staging.test.mjs archify/test/release-package-gates.test.mjs archify-ja.zip docs/install-uninstall-evidence.md README.md
git commit -m "build: prepare archify-ja release candidate"
```

### Task 9: 公開（明示承認後のみ）

**Files:**
- External: GitHub repository `microtaro/archify-ja`
- External: GitHub Release `v2.16.0-ja.1`
- Modify after verification if needed: `docs/install-uninstall-evidence.md`

**Interfaces:**
- Consumes: Task 8のクリーンなcommitと`archify-ja.zip`。
- Produces: 公開GitHubリポジトリ、Release、公開URLからの導入・削除検証結果。

- [ ] **Step 1: 公開対象をread-onlyで確認する**

Run: `git status --short --branch && git log --oneline --decorate -10 && sha256sum archify-ja.zip`

Expected: clean worktree、公開対象commit、ZIP SHA-256が表示される。

- [ ] **Step 2: ユーザーへ外部公開の明示承認を求める**

リポジトリ作成、remote追加、push、Release作成、公開URLからの導入試験を列挙する。承認が得られるまで以降を実行しない。

- [ ] **Step 3: 承認後にGitHubリポジトリとReleaseを作る**

本家履歴を保持したまま`microtaro/archify-ja`へpushし、tag `v2.16.0-ja.1`とReleaseを作成して`archify-ja.zip`を添付する。既存の`origin`を破壊的に上書きせず、本家remoteと日本語版remoteを識別できる名前で保持する。

- [ ] **Step 4: 公開URLから導入・削除を再検証する**

READMEに記載した4 Agentのコマンドを隔離環境で実行する。Skill IDが`archify-ja`、Viewer既定が`ja-JP`、本家`archify`と同居可能、削除後に日本語版だけが消えることを確認する。

- [ ] **Step 5: 公開結果を報告する**

リポジトリURL、Release URL、tag、commit OID、ZIP SHA-256、検証したAgent、未対応範囲を日本語で報告する。公開後に文書修正が必要になった場合は、新しいcommitを作り、tag/Release assetとの不一致を放置しない。
