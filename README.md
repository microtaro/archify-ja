<p align="center">
  <strong>日本語</strong> · <a href="./README_EN.md">English</a>
</p>

![Archify-ja プレビュー](docs/assets/archify-readme-hero.png)

# Archify-ja

**コードベースやシステムの説明から、検証可能で操作できる技術図をチャット内で生成します。**

Archify-jaは、Cursor、Claude Code、Codex CLI、OpenCode向けのAgent Skillです。Agentが型付きJSON IRを作り、Node.js製のrendererとvalidatorが自己完結HTML/SVGへ決定論的に変換します。

- Architecture、Workflow、Sequence、Data Flow、Lifecycleの5形式
- dark/light theme、4種類のvisual preset、有限motion
- node検索、上流・下流の到達範囲、経路探索、role比較、guided story
- Schema・layout・HTML/SVG・route・label clearanceの検証
- PNG、JPEG、WebP、SVG、WebM、1200×630 Share Card出力

![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)
![Agent Skill](https://img.shields.io/badge/Agent-Skill-7C3AED?style=flat-square)
![Japanese Edition Version](https://img.shields.io/badge/version-2.16.0--ja.1-0891b2?style=flat-square)

**日本語版:** `v2.16.0-ja.1`
**Repository:** [microtaro/archify-ja](https://github.com/microtaro/archify-ja)

Archify-jaは[`tt-a1i/archify`](https://github.com/tt-a1i/archify) v2.16.0を基にした非公式の日本語派生版です。本家への継続追従は保証しません。

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

project導入を削除する場合は`--global`を外します。手動で配置した場合は、配置先にある`archify-ja` directoryだけを削除してください。

## 使い方

Repositoryは必須ではありません。チャットでシステムを説明するだけでも使えます。

```text
Archify-jaを使って、Browser -> API -> Redis cache -> PostgreSQL fallbackを図にしてください。
```

実装根拠を使う場合:

```text
このrepositoryを調査し、Archify-jaで高レベルのruntime architecture図を作成してください。
主要componentを8〜12個、主経路を1本、外部依存とtrust boundaryを表示してください。
補足はedgeを増やさずcardへ記載してください。
```

## 図の選び方

| 形式 | 適した内容 |
|---|---|
| Architecture | component、service、storage、boundary |
| Workflow | CI/CD、approval、runbook、分岐 |
| Sequence | API call、cache fallback、認証、非同期処理 |
| Data Flow | pipeline、lineage、PII、consumer |
| Lifecycle | state、retry、wait、terminal outcome |

迷った場合はCLI guideを使えます。

```bash
node archify/bin/archify.mjs guide "Redisのcache missを含むAPI request"
```

## Preview

| Dark | Light |
|---|---|
| ![Dark theme](docs/assets/archify-dark.png) | ![Light theme](docs/assets/archify-light.png) |

ViewerのExport menuから静止画・動画・Share Cardを出力できます。

![Export menu](docs/assets/archify-menu.png)

経路を選択した後、**Export → Route Share Card**で全体図を保持した1200×630 PNGを出力します。

![Route Share Card](docs/assets/archify-route-share-card.png)

上流・下流の到達範囲を選択した後、**Reach Share Card**を出力できます。

![Reach Share Card](docs/assets/mco-runtime-reach-share-card.png)

## Upstream Archify examples

次の画像は派生元Archifyの参考例です。Archify-jaの公開siteへのlinkではありません。

<p align="center">
  <img src="docs/assets/archify-live-proof.gif" alt="Upstream Archify reference artifacts" width="960"/>
</p>

| Guided story | Route probe | Semantic lens |
|---|---|---|
| ![Workflow](docs/assets/archify-demo-story.png) | ![Sequence](docs/assets/archify-demo-route.png) | ![Architecture](docs/assets/archify-demo-lens.png) |

実repositoryの参考例:

![MCO runtime architecture](docs/assets/mco-runtime-share-card.png)

派生元は[`mco-org/mco`](https://github.com/mco-org/mco)のrevision `9f1a1cf`を調査して作成しています。型付きsourceは[`docs/cases/mco-runtime.architecture.json`](docs/cases/mco-runtime.architecture.json)です。

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

`deliver`は候補を検証し、成功した場合だけ出力先をatomicに置き換えます。`--open`はcommit後のartifactだけを開きます。

失敗時、`validate --json`と`deliver --json`はmachine-readableな`diagnostics[]`を返します。各diagnosticの`supportedFixes`だけを適用し、修正は最大2回です。

## Locale

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

`meta.locale`はViewer UI、Legend、状態・error、ARIA、HTML/SVGの`lang`を切り替えます。title、node、relationship、cardなどのauthored contentは自動翻訳しません。

## Viewer操作

| 操作 | Key |
|---|---|
| Guide | <kbd>?</kbd> |
| node検索 | <kbd>/</kbd> |
| directed route | <kbd>R</kbd> |
| semantic role比較 | <kbd>L</kbd> |
| overview map | <kbd>M</kbd> |
| story再生 | <kbd>P</kbd> |
| presentation | <kbd>F</kbd> |
| style / theme / export | <kbd>S</kbd> / <kbd>T</kbd> / <kbd>E</kbd> |
| zoom / reset | <kbd>+</kbd> / <kbd>-</kbd> / <kbd>0</kbd> |

Viewerの完全な契約は[`archify/SKILL.md`](archify/SKILL.md)を参照してください。

## 配布範囲

- RavenとDeepSeek Harnessは初版の対象外です。
- 独自の更新manifestはなく、update checkのnetwork requestは行いません。
- hosted Proof Labはありません。
- WYSIWYG editor、hosted sharing、一般purposeのauto-layoutは対象外です。

## License

[MIT](LICENSE)。元の著作権表示を保持しています。

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。
