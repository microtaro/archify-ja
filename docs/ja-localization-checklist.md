# archify-ja 日本語化チェックリスト

生成: 2026-08-31 / 実測ベース（手書きではなくスキャン結果から生成）

作業のたびにこのファイルを開き、完了した項目の `[ ]` を `[x]` にすること。
件数はスキャン時点の値なので、まとめて直したら再スキャンして更新する。

## A. 翻訳漏れ（catalog を経由しない英語文字列）

`translateCliMessage` / `translateMessage` を通さずユーザーに出る文字列。
カタログのキー一致率（en/ja とも一致）では検出できない層。

**注意: 単純なスキャンは3種を区別できない。** 分類してから着手すること。

| 分類 | 件数 | 扱い |
| --- | --- | --- |
| sentinel（境界で写像される内部エラー） | 17 | **対象外**。`localizeBrandCaptureError` が catalog キーへ写像する。全件写像済みを検算済み |
| internal（内部不変条件） | 9 | **対象外**。踏んだらバグという類。英語のままが正しい |
| 実際の翻訳漏れ | 51 | 下記 |

開始時 130 件と数えていたが、うち sentinel 17 / internal 9 / 対応済み 53 で、**残る実対象は 51 件**。

### 優先度3 — 補助コマンド（ユーザーに出る）

- [ ] `bin/visual-check.mjs` — 19 件 · Chrome 連携の失敗（`Chrome closed with ...`、`timed out after ...`）
- [ ] `bin/preview.mjs` — 4 件 · ライブプレビュー（`Could not open the preview ...`）

### 優先度4 — 開発用ツール（利用者には通常出ない）

- [ ] `scripts/generate-brand-marks.mjs` — 7 件
- [ ] `scripts/generate-validators.mjs` — 3 件

### 対象外（記録のみ）

- [x] `scripts/check-update.mjs` — 18 件 · **触らない**。常に `{"status":"silent","reason":"disabled"}` を返す死んだ経路。
      本家追随の方針が決まるまで残す（[[方針]] 参照）
- [x] `renderers/shared/brand-marks.mjs` — sentinel 17 件。`localizeBrandCaptureError` 経由で日本語化される。
      10 種の sentinel 全てが catalog キーへ写像されることを実測済み
- [x] `renderers/shared/utils.mjs` — 5 件 · internal（`applyTemplate: template missing ... sentinel`）
- [x] `renderers/workflow/workflow-compiler.mjs` — 4 件 · internal（`unreachable ... state` 等）
- [x] `renderers/shared/validator.mjs` — 1 件 · スキーマ検証の見出しは CLI 境界で日本語化済み（実測）

### 完了

- [x] `renderers/shared/repository-evidence.mjs` — 診断18・修正案19・Gitエラー2 を catalog 化（`evidence.*`）
- [x] `renderers/shared/output-path.mjs` — 診断8・修正案8（`output.*`）。`OutputPathError` の二重メッセージも解消
- [x] `renderers/shared/engineering-profiles.mjs` — 診断7・修正案7・見出し1（`deployment.*`）
- [x] `renderers/shared/legend.mjs` — 診断3・修正案3（`legend.*`）
- [x] `renderers/shared/diagnostics.mjs` — 6箇所を既存 `input.*` キーへ接続
- [x] `recipes/scenarios.mjs` — 11シナリオ全文 + 日本語 signals + 出力ラベル14（`guide.*`）

### 進め方

1. 対象の英語文字列に対応するキーを `i18n.mjs` の `CLI_MESSAGE_SOURCES`（en）と
   `CLI_MESSAGES_JA`（ja）へ**両方**追加する。**追加前に既存キーを検索すること**
   （`input.json-parse.message` 等が既にあり、重複を作りかけた）
2. 呼び出し側を `translateCliMessage(key, values)` に差し替える
3. 英語部分文字列で分岐している箇所（`message.includes(...)`）は `code` 直持ちへ直す
4. en/ja のキー数一致を確認する

## B. テストの書き換え（英語前提 → catalog 参照）

**回帰検知は先に確保済み。** 48件を直さなくても新しい失敗は検知できる。

```
npm test                      既知48件は無視し、新規失敗があれば exit 1
npm run test:known:update     期待値を直したらベースラインを縮める
```

`docs/known-test-failures.json` に失敗中のテスト名を記録し、
`scripts/known-failures.mjs` が TAP 出力と突き合わせる。
新規失敗は名指しで報告し、通るようになった既知失敗も報告してベースラインの
惰性的な肥大を防ぐ。**このリストは縮めるためのもので、増やしてはならない。**

以下は残っている書き換え作業。急ぎではない。


**残り 77 件 / 44 ファイル**

`test/helpers/viewer-copy.mjs` のヘルパを使い、期待値を catalog から引く。
英語も日本語も直書きしない。翻訳が英語へ退行したら落ちるようにする。

| ヘルパ | 用途 |
| --- | --- |
| `copyPattern(key)` | Viewer UI 文言（`translateMessage`） |
| `cliPattern(key, values)` | CLI 診断（`translateCliMessage`） |
| `cliFragment(key)` | `{placeholder}` を含む文言の、値に依存しない部分だけ照合 |

- [ ] `test/story-trail.test.mjs` — 5 件
- [ ] `test/animation.test.mjs` — 4 件
- [ ] `test/authoring-safety-contract.test.mjs` — 4 件
- [ ] `test/readme-showcase.test.mjs` — 4 件
- [ ] `test/share-card-export.test.mjs` — 4 件
- [ ] `test/delivery-contract.test.mjs` — 3 件
- [ ] `test/preview-contract.test.mjs` — 3 件
- [ ] `test/route-probe.test.mjs` — 3 件
- [ ] `test/cli.test.mjs` — 2 件
- [ ] `test/finder.test.mjs` — 2 件
- [ ] `test/guide-page.test.mjs` — 2 件
- [ ] `test/motion-governor.test.mjs` — 2 件
- [ ] `test/presentation.test.mjs` — 2 件
- [ ] `test/preset-tryon.test.mjs` — 2 件
- [ ] `test/reach-share-card.test.mjs` — 2 件
- [ ] `test/semantic-lens.test.mjs` — 2 件
- [ ] `test/semantic-radar.test.mjs` — 2 件
- [ ] `test/workflow-compiler.test.mjs` — 2 件
- [ ] `test/adaptive-reader-layout.test.mjs` — 1 件
- [ ] `test/architecture-delta.test.mjs` — 1 件
- [ ] `test/automatic-port-spread.test.mjs` — 1 件
- [ ] `test/chapter-rail.test.mjs` — 1 件
- [ ] `test/community-proof-intake.test.mjs` — 1 件
- [ ] `test/cursor-onboarding.test.mjs` — 1 件
- [ ] `test/diagram-guide.test.mjs` — 1 件
- [ ] `test/english-only-localization.test.mjs` — 1 件
- [ ] `test/gallery.test.mjs` — 1 件
- [ ] `test/geometry.test.mjs` — 1 件
- [ ] `test/intent-trace.test.mjs` — 1 件
- [ ] `test/japanese-documentation.test.mjs` — 1 件
- [ ] `test/ordinary-model-floor.test.mjs` — 1 件
- [ ] `test/preview.test.mjs` — 1 件
- [ ] `test/real-repository-proof.test.mjs` — 1 件
- [ ] `test/relationship-lens.test.mjs` — 1 件
- [ ] `test/release-identity.test.mjs` — 1 件
- [ ] `test/route-journey.test.mjs` — 1 件
- [ ] `test/route-share-card.test.mjs` — 1 件
- [ ] `test/semantic-legend-gateway.test.mjs` — 1 件
- [ ] `test/semantic-zoom.test.mjs` — 1 件
- [ ] `test/sequence-column-fit.test.mjs` — 1 件
- [ ] `test/story-moment-link.test.mjs` — 1 件
- [ ] `test/update-contract.test.mjs` — 1 件
- [ ] `test/v1-compatibility.test.mjs` — 1 件

### 済み

- [x] `test/semantic-passport.test.mjs` — 4/4 green
- [x] `test/brand-marks.test.mjs` — 25/25 green（過程で A の brand 診断9キーも追加）
- [x] `test/repository-evidence.test.mjs` — 6/6 green
- [x] `test/output-path.test.mjs` — 19/19 green
- [x] `test/engineering-profile.test.mjs` — 7/7 green

## C. 監査項目の残り

- [ ] `archify guide` が全面英語 — `recipes/scenarios.mjs` の11シナリオ。
      `startPromptsFor` が `const language = 'en'` 固定、`recommendScenario` も `const lang = 'en'` 固定。
      さらに `test/english-only-localization.test.mjs` が「英語であること」を強制している
- [ ] 同梱サンプルが英語 — `archify/examples/*.html` が `<html lang="en">`。再レンダリングで直るが配布物なので要判断
- [ ] GitHub Pages サイトが未翻訳 — `docs/index.html` / `start.html` / `gallery.html` は日本語 0 行
- [ ] バージョン不整合 — `package.json` は `2.16.0-ja.1`、Pages 表記は `v2.16.0`
- [ ] ドキュメントの英語見出し — `references/delivery-contract.md:33`、`references/viewer-runtime.md:35,39`
- [x] zip 配布機構の削除 — commit `af82076`

## D. 本家機能の取り込み漏れ（言語・配布以外は残す方針）

- [x] `meta.views`（ガイド付きストーリー）— **完了**。5チャプター追加（編集ループ / 取込経路 / 書き出し経路 / 永続化 / 検証）。
      あわせて E の到達性の欠陥も修正済み（詳細は E を参照）

## E. スキル本体の設計課題（翻訳とは別。本家由来）

- [ ] **`validate` に意味的な検査が1つも無い** — composition 検査は
      `ambiguous-corridor` / `container-border-run` / `edge-through-node` /
      `endpoint-side-direction` / `label-route-clearance` / `proper-crossing` の6種で、
      **全て幾何**。到達性・孤立ノード・入次数の検査はコード全体で0件。
      実験: 接続1本・孤立ノード2個の図が「エラー0・警告0」で通る。

      これが害になるのは、診断のフィードバックループが逆向きに働くため。
      `edge-through-node` が出たとき最も安上がりな解決は「線を消す」ことで、
      消すと診断が消えてツールは緑を返し、意味が壊れたことは誰も検知しない。

      実害の記録: 25ノードの architecture 図で、`edge-through-node` を通すために
      ハブノードから4本の線を削除したところ、その4本の行き先が入次数0で孤立し、
      **25ノード中14ノードが外部入力から到達不能**になった。それでも validate は合格。
      経路プローブ（`R` キー）は検出できるが、人間がクリックして初めて分かるもので
      検証パイプラインには乗っていない。

      対応案: エラーではなく**警告**として「外部入力から到達できないノードが N 個」を出す。
      意図的に孤立させる図もありうるためエラーは不適切。
      ja版で先に入れるか本家へ投げるかは別途判断。

## 方針（前提）

- 本家の機能は**言語と zip/バージョン配布の問題以外はそのまま必要**。機能を落とさない
- 本家への自動追随はしない。変更が出てから必要な部分だけ取り込む
- そのためテストは「本家と互換」ではなく **archify-ja 自身の契約**に書き換える
