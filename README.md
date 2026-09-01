<p align="center">
  <strong>日本語</strong> · <a href="./README_EN.md">English</a>
</p>

![Archify-ja プレビュー](docs/assets/archify-readme-hero.png)

# Archify-ja

**コードベースやシステムの説明から、検証可能で操作できる技術図をチャット内で生成します。**

Archify-jaは、Cursor、Claude Code、Codex CLI、OpenCode向けのAgent Skillです。Agentが型付きJSON IRを作り、Node.js製のrendererとvalidatorが自己完結HTML/SVGへ決定論的に変換します。

- 構成図、業務フロー、シーケンス、データフロー、ライフサイクルの5形式
- ダーク／ライトの両テーマ、4種類の表示スタイル、限定的なモーション
- ノード検索、上流・下流の到達範囲、経路探索、役割の比較、ガイド付きストーリー
- スキーマ、レイアウト、HTML/SVG、経路、ラベルの余白を検証
- PNG、JPEG、WebP、SVG、WebM、1200×630 の共有カード（ルート／到達範囲）を書き出し

![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)
![Agent Skill](https://img.shields.io/badge/Agent-Skill-7C3AED?style=flat-square)
![Japanese Edition Version](https://img.shields.io/badge/version-2.16.0--ja.1-0891b2?style=flat-square)

**日本語版:** `v2.16.0-ja.1`
**リポジトリ:** [microtaro/archify-ja](https://github.com/microtaro/archify-ja)

Archify-jaは[`tt-a1i/archify`](https://github.com/tt-a1i/archify) v2.16.0を基にした非公式の日本語派生版です。本家への継続的な追従は保証しません。

## インストール

### Codex

```bash
npx skills add microtaro/archify-ja --skill archify-ja --agent codex --global --copy --yes
```

### Cursor

```bash
npx skills add microtaro/archify-ja --skill archify-ja --agent cursor --global --copy --yes
```

### Claude Code

```bash
npx skills add microtaro/archify-ja --skill archify-ja --agent claude-code --global --copy --yes
```

### OpenCode

```bash
npx skills add microtaro/archify-ja --skill archify-ja --agent opencode --global --copy --yes
```

現在のprojectだけへ入れる場合は`--global`を外します。導入確認:

```bash
npx skills list --global
```

更新する場合:

```bash
npx skills update archify-ja --global --yes
```

## アンインストール

全Agentのglobal導入から削除:

```bash
npx skills remove archify-ja --global --yes
```

Agentを限定する場合:

```bash
npx skills remove archify-ja --global --agent codex --yes
npx skills remove archify-ja --global --agent cursor --yes
npx skills remove archify-ja --global --agent claude-code --yes
npx skills remove archify-ja --global --agent opencode --yes
```

プロジェクト単位の導入を削除する場合は`--global`を外します。手動で配置した場合は、配置先にある `archify-ja` ディレクトリだけを削除してください。

## 使い方

Repositoryは必須ではありません。チャットでシステムを説明するだけでも使えます。

```text
Archify-jaを使って、Browser -> API -> Redis cache -> PostgreSQL fallbackを図にしてください。
```

迷ったら、まず日本語で聞けます。

```bash
node archify/bin/archify.mjs guide "APIの呼び出し順序を描きたい"
# → 推奨: API 呼び出し連鎖 [sequence]  確信度: 高
```

## 5つの図種と頼み方

同じシステムでも、問いが違えば図種が変わります。以下はそのまま貼って使える例です。

### Architecture — 何があり、どう繋がっているか

```text
このrepositoryを調査し、Archify-jaで構成図を作成してください。
実行時の主要componentと、外部依存、主経路を1本示してください。
補足はedgeを増やさずcardへ記載してください。
```

より細かく分解したい場合は、その旨を伝えてください。密度を上げると
ラベル衝突が増えるため、`quality_profile` は `standard` が適します。

```text
レイヤ単位まで細かく分解し、UI・状態・ドメイン・永続化をboundaryで囲んでください。
密度を優先するのでquality_profileはstandardにしてください。
```

### Sequence — 誰が誰を、どの順で呼ぶか

Architectureには時間軸がありません。呼び出し順序、待ち合わせ、
非同期の戻りを見せたいときはこちらです。

```text
取り込み処理の呼び出し順序をArchify-jaのsequenceで描いてください。
参加者ごとのライフラインを立て、確定を待つ箇所が分かるようにしてください。
```

### Workflow — 分岐と担当

```text
リリース工程をArchify-jaのworkflowで描いてください。
開発者・CI・承認・環境をレーンに分け、成功経路を一目で分かるようにし、
ロールバック経路も示してください。
```

### Dataflow — データがどこから来て誰が使うか

```text
このsystemのデータリネージをArchify-jaで描いてください。
ソース、変換、蓄積、利用者をステージに分け、
個人情報や社外秘が流れる経路はclassificationで明示してください。
```

### Lifecycle — どの状態を取り、どう終わるか

```text
注文の状態遷移をArchify-jaのlifecycleで描いてください。
開始・実行中・待ち・失敗・終端を状態として並べ、
遷移を起こすイベントをラベルにしてください。
```

## 図を強くするオプション

いずれも任意です。頼まなければ付きません。

### ソースの根拠を付ける（architectureのみ）

各componentに対応するソースファイルを記録すると、Semantic Passportに
「検証済みソース」欄が出ます。`git` が固定commitでのファイルと行の実在を
確認するため、**存在しないパスを書くと検証で落ちます**。

```text
各componentに対応するソースファイルをsourcesとして記録してください。
```

検証はローカルで完結し、networkには出ません。公開GitHub URLを
`meta.repository.url` に書いた場合だけ、Viewerがpermalinkのリンクにします。
未pushやprivateのrepositoryではURLを省いてください。

### ガイド付きストーリーを付ける

図に名前付きのチャプターを定義すると、読み手が経路を順に辿れます。

```text
「取り込み経路」「書き出し経路」「検証」の3つのストーリーをviewsとして定義してください。
```

### 実在サービスのロゴを出す

```text
Box、PostgreSQL、Redisは公式brandで表示してください。
```

### 見た目を変える

`classic`（既定）、`signal-flow`、`blueprint`、`editorial` から選べます。

```text
visual_presetはblueprintにしてください。
```

## Mermaidから変換する

既存のMermaidを貼れば、意味を読み取って作り直します。styleの機械的な
再現ではなく、`[*]` を開始・終端として解釈するなど意味を維持した変換です。

- `flowchart` / `graph` → `workflow`（構成の地図なら `architecture`）
- `sequenceDiagram` → `sequence`
- `stateDiagram` → `lifecycle`

```text
このMermaidをArchify-jaで作り直してください。

stateDiagram-v2
    [*] --> Draft
    Draft --> Review: submit
    Review --> Approved: approve
```

## 図の選び方

| 形式 | 適した内容 | 答えられる問い |
|---|---|---|
| `architecture` | 構成要素、サービス、データストア、信頼境界 | 何が存在し、どう繋がっているか |
| `workflow` | CI/CD、承認、運用手順、分岐 | どう進み、どこで分かれるか |
| `sequence` | API 呼び出し、キャッシュ退避、認証、非同期処理 | 誰が誰を、どの順で呼ぶか |
| `dataflow` | パイプライン、リネージ、個人情報、利用者 | データはどこから来て誰が使うか |
| `lifecycle` | 状態、リトライ、待ち、終端 | どの状態を取り、どう終わるか |

形式名はそのまま CLI の引数になります（`archify guide` の推奨もこの名前で返ります）。

## 表示例

| ダーク | ライト |
|---|---|
| ![ダークテーマ](docs/assets/archify-dark.png) | ![ライトテーマ](docs/assets/archify-light.png) |

ビューアの「書き出し」メニューから静止画・動画・共有カードを出力できます。

![Export menu](docs/assets/archify-menu.png)

経路を選択した後、**書き出し → ルート共有カード**で全体図を保持した1200×630 PNGを出力します。

![ルート共有カード](docs/assets/archify-route-share-card.png)

上流・下流の到達範囲を選択した後、**到達範囲共有カード**を出力できます。

![到達範囲共有カード](docs/assets/mco-runtime-reach-share-card.png)

## 派生元 Archify の参考例

次の画像は派生元Archifyの参考例です。Archify-jaの公開siteへのlinkではありません。

<p align="center">
  <img src="docs/assets/archify-live-proof.gif" alt="Upstream Archify reference artifacts" width="960"/>
</p>

| ガイド付きストーリー | 経路探索 | セマンティックレンズ |
|---|---|---|
| ![ストーリー](docs/assets/archify-demo-story.png) | ![経路探索](docs/assets/archify-demo-route.png) | ![Architecture](docs/assets/archify-demo-lens.png) |

実repositoryの参考例:

![MCO runtime architecture](docs/assets/mco-runtime-share-card.png)

派生元は[`mco-org/mco`](https://github.com/mco-org/mco)のリビジョン `9f1a1cf` を調査して作成しています。型付きの入力は[`docs/cases/mco-runtime.architecture.json`](docs/cases/mco-runtime.architecture.json)です。

## CLI

```bash
cd archify
node bin/archify.mjs doctor
node bin/archify.mjs demo /tmp/archify-demo
node bin/archify.mjs validate workflow examples/agent-tool-call.workflow.json --quality showcase --json
node bin/archify.mjs preview workflow examples/agent-tool-call.workflow.json /tmp/workflow.html --quality showcase
node bin/archify.mjs deliver workflow examples/agent-tool-call.workflow.json /tmp/workflow.html --quality showcase --open --json
```

`preview`は`127.0.0.1`のrandom portで1つのJSON sourceを監視し、検証に成功したrevisionだけを表示します。停止はCtrl-Cです。

`deliver`は候補を検証し、成功した場合だけ出力先を不可分に置き換えます。`--open` は確定後の成果物だけを開きます。

失敗時、`validate --json`と`deliver --json`は機械可読な `diagnostics[]`を返します。各診断の `supportedFixes` だけを適用し、修正は最大2回です。

## 言語の切り替え

日本語が既定です。英語Viewerを使う場合だけ`meta.locale`を指定します。

```json
{
  "meta": {
    "locale": "en",
    "animation": "trace",
    "visual_preset": "signal-flow"
  }
}
```

`meta.locale` はビューアの UI、凡例、状態・エラー、ARIA、HTML/SVG の `lang` を切り替えます。タイトル、ノード、関係、カードなど、作者が記述した内容は自動翻訳しません。

## ビューアの操作

| 操作 | Key |
|---|---|
| ガイド | <kbd>?</kbd> |
| ノード検索 | <kbd>/</kbd> |
| 経路探索 | <kbd>R</kbd> |
| 役割の比較 | <kbd>L</kbd> |
| 俯瞰マップ | <kbd>M</kbd> |
| ストーリー再生 | <kbd>P</kbd> |
| プレゼンテーション表示 | <kbd>F</kbd> |
| スタイル / テーマ / 書き出し | <kbd>S</kbd> / <kbd>T</kbd> / <kbd>E</kbd> |
| 拡大 / 縮小 / リセット | <kbd>+</kbd> / <kbd>-</kbd> / <kbd>0</kbd> |

ビューアの完全な契約は[`archify/SKILL.md`](archify/SKILL.md)を参照してください。

## 対象範囲

- RavenとDeepSeek Harnessは初版の対象外です。
- 独自の更新manifestはなく、update checkのnetwork requestは行いません。
- ホスト版の Proof Lab はありません。
- WYSIWYG エディタ、ホスト型の共有、汎用の自動レイアウトは対象外です。

## License

[MIT](LICENSE)。元の著作権表示を保持しています。

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。
