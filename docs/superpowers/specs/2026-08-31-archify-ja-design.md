# Archify 日本語派生版 設計

## 目的

Archify v2.16.0を基に、日本語利用者が導入、作図、検証、修正、保守まで日本語で完結できる独立Skill `archify-ja` を作成する。これは本家へ継続追従するフォークではなく、特定時点の英語版Archifyを正本とする日本語スナップショット派生版である。

## 翻訳原則

翻訳元は英語だけとする。中国語文書、`zh-CN`カタログ、暫定日本語、機械置換結果を翻訳元、置換元、fallbackとして使用しない。

実装は必ず2段階に分ける。

1. 本家スナップショットから英語だけの正本を作り、全テストを通す。
2. 固定した英語正本の各項目を英語から直接日本語へ翻訳する。

英語正本コミットと日本語追加コミットを分離する。日本語訳は、対応するkey、英語原文、日本語訳を追跡可能にする。

## 公開識別

- Repository: `microtaro/archify-ja`
- Skill ID: `archify-ja`
- 表示名: Archify 日本語版
- 初版: `2.16.0-ja.1`
- 派生元: `tt-a1i/archify` v2.16.0、commit `5de7275`
- License: MIT。元の著作権表示と許諾文を保持する。
- 非公式派生版であり継続同期を保証しないことをREADME冒頭へ明記する。

本家と同時導入できるよう、Skill名、ZIP、generator、release identityを分離する。JSON field、CLI command/option、JavaScript identifier、diagnostic codeは変更しない。

## 英語正本

正本は、本家の英語`README.md`、`archify/SKILL.md`、`archify/references/*.md`、Schema説明、`en` Viewer catalog、英語CLI文言、英語exampleとする。

英語正本の確立時に次を除外する。

- `README_ZH.md`
- `README_EN.md`（英語`README.md`との重複）
- `docs/authoring-cookbook.zh-CN.md`
- `zh-CN` Viewer catalog、Schema enum、専用テスト
- 中国語を根拠に作られた日本語

日本語版の最終対応localeは`ja-JP`と`en`だけとする。`zh-CN`は配布対象外である。

## 日本語化範囲

英語正本から直接翻訳する。

- `archify/SKILL.md`と`archify/references/*.md`
- README、導入、再導入、削除、基本操作
- Viewerの全固定文言、凡例、help、state、error、ARIA
- CLI usage、利用者向けerror、診断説明、修正候補
- JSON Schemaの利用者向け説明
- 日本語exampleと主要test data

日本語利用者が日本語文書だけでSkillを理解し修正できることを公開条件とする。

日本語向けに、`meta.locale: "ja-JP"`、日本語既定値、HTML/SVG `lang`、font、line-height、折返し、禁則、CJK幅計算を実装する。PNG、SVG、WebM、Share Cardも検証する。authored contentは自動翻訳しない。

JSON field、CLI command/option、identifier、diagnostic code、brand/product/spec名、元の著作権表示、過去CHANGELOGと研究記録は原文を保持する。

## 翻訳品質

Viewer catalogは英語keyを正本にし、日本語catalogは同一keyと同一interpolation variableを過不足なく持つ。英日対照表を作り、全keyを`key | English source | Japanese`で1回ずつ記録する。

禁止事項:

- `zh-CN`値のコピー、置換、fallback
- 単語置換による文章生成
- 未翻訳keyの別言語fallback
- testを通すための意味削除

自動testはkey集合、変数集合、空文字、未翻訳英語、簡体字を検査する。自然さは自動検査だけでは証明できないため、英日対照表をカテゴリ単位で精読した記録を必須とする。

## 文字数と表示制約

- Agent runtimeの1024文字・1024byteなど外部仕様は維持する。
- 修正回数、主要要素数、比較数など安全性・情報設計上の制約は維持する。
- label 48/80文字、note 140文字など英語表示幅由来の制約は、日本語の実表示幅、折返し、衝突検査へ移す。

意味を削る前に、node幅、行数、line-height、余白、route、図の分割を修正する。

## 実装順序

1. `zh-CN`を除去し、英語だけの全機能がGREENの基準線を作る。
2. package、Skill、ZIP、generator、releaseを`archify-ja`へ分離し、更新通信を無効化する。
3. 英語Viewer catalogから`ja-JP`を全件直接翻訳する。
4. 英語CLIから日本語CLIと診断を翻訳する。
5. 英語Skill文書と参照文書から日本語文書を作る。
6. 日本語の表示幅と折返しを実装する。
7. 英語READMEを基に日本語READMEと実証済み導入・削除手順を作る。
8. 日本語exampleを作り、実ブラウザとexportを確認する。
9. 中国語を含まないclean ZIPと全回帰を確認する。
10. 明示承認後だけGitHubへ公開する。

Codex、Cursor、Claude Code、OpenCodeのproject/global導入、確認、再導入、削除を隔離領域で実証する。Raven、DeepSeek Harness、独自site、独自更新配信基盤は初版対象外とする。

## 検証

- 英語基準線だけで全test PASS
- 明示`en`の機械契約と意味を維持
- `ja-JP`全keyが英語keyと1対1で対応し、変数一致
- 中国語catalog、Schema値、fallback、文書が配布物に存在しない
- 日本語Architecture、Workflow、Sequenceをshowcase品質で生成
- wide/narrow、light/dark、Finder、Route、Export、keyboard、ARIAを実ブラウザ確認
- PNG/SVGで文字化け、切れ、重なりなし
- clean ZIPから4 Agentへ導入・削除成功

## 公開境界

実装とlocal検証は隔離worktreeで行う。GitHub repository作成、remote変更、push、tag、Release、公開URL検証は実行直前に明示承認を得る。履歴は本家から保持する。

## 非目標

- 本家の将来releaseへの自動追従
- 中国語localeの維持
- 全研究記録と過去CHANGELOGの翻訳
- JSON fieldやCLI commandの日本語化
- 独自site、更新配信基盤、Raven、DeepSeek Harness
- 本家にない図形式や推論機能

## 完了条件

- 翻訳元が英語正本だけであることをGit履歴と英日対照表で確認できる。
- 日本語文書だけで導入、作図、検証、修正、削除できる。
- 日本語Viewer、CLI、artifactが実際に動作する。
- 日本語を意味を損なう短縮なしで扱える。
- 本家と同時導入でき、更新先と配布識別が混ざらない。
- 検証済みZIPと実証済み導入・削除手順を公開できる。
