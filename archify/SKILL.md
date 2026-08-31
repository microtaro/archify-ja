---
name: archify
description: 洗練され、検証済みの architecture、workflow、sequence、data-flow、lifecycle/state ダイアグラムを作成する。成果物はインラインSVG、ダーク/ライトテーマ、任意のトレースモーション、PNG/JPEG/WebP/SVG/WebM書き出しを備えた、探索可能で自己完結した standalone HTML。自然言語の要件、または貼り付けられた Mermaid の flowchart、sequenceDiagram、stateDiagram を入力として受け付ける。実在するコードを反映する場合は repository evidence を調査する。システム構成、インフラ、クラウド/セキュリティ/ネットワーク構成、技術的な処理手順、API呼び出し順序、リクエストのライフサイクル、データパイプライン、ETL/ELT、データリネージ、ステートマシンの可視化、または Mermaid の変換・美化をユーザーが求めた場合に利用する。
license: MIT
metadata:
  version: "2.16"
  author: microtaro
  based_on: Cocoon-AI/architecture-diagram-generator (MIT, v1.0)
---

# Archify-ja 日本語版

小さな型付きJSON仕様から、自己完結した対話型HTMLダイアグラムを作成します。静的な出力が既定です。ユーザーがデモまたはプレゼンテーションを求めた場合にだけモーションを有効にしてください。

## 最短のオーサリング手順

通常の生成には、この限定された手順を使います。ユーザーがその機能を求めない限り、任意のViewer Runtimeリファレンスを読んではなりません。

1. 質問から `architecture`、`workflow`、`sequence`、`dataflow`、`lifecycle` のいずれかを選びます。
2. `schemas/` にある対応するschema 1つ、`schemas/common.schema.json`、および `examples/` にある対応するJSON例1つを読みます。それらのファイルだけを読んでください。新規オーサリングでは、新しい安定ID、ドメインの表現、レイアウトを作ります。例はfieldの形にだけ使い、事実には使わないでください。新しいworkflow sourceには `schema_version: 2` とその可読性レイアウト契約を使います。既存workflowの固定ジオメトリを維持する場合にだけ `schema_version: 1` を残します。実在製品のidentityが重要な場合は `node bin/archify.mjs brands "<name>" --json` で問い合わせます。ユーザー提供URLを持つ未知のbrandについてだけ `references/brand-marks.md` を読んでください。
3. 成果物を先に作ります。次のtool actionでは候補を書き込まなければなりません。renderer内部を調べる前に候補を書いてください。正確な座標を文章で計画してはなりません。明確なmain path 1本、短いside branch、疎なlabel、primary node最大12個から始めます。ユーザーが密な `standard` mapを明示的に求めない限り、`meta.quality_profile` を `"showcase"` にします。自動routeとlabelから始めます。診断が要求する前に `via`、`channelX`、`channelY`、`labelAt` を加えてはなりません。1回の修正につき、診断されたgeometry controlを最大1つだけ適用します。
4. 候補を編集するたび、および引き渡し直前に検証します。

   ```bash
   node bin/archify.mjs validate <type> <candidate.json> --quality showcase --json
   ```

   artifact checkが4件だけのreceiptはbasic validationであり、showcase acceptanceではありません。showcaseの合格にはartifact check全9件、composition error 0件、warning 0件が必要です。候補に正確な `meta.quality_profile` fieldがない、または綴りが誤っている場合は、geometryより先に修正します。workflow v2のgeometry診断では `node bin/archify.mjs validate workflow <candidate.json> --layout-json` を実行し、安定したcompiler receiptを使います。solver内部はオーサリング用controlではありません。最終検証に合格した候補は凍結します。凍結後は決して編集しないでください。
5. 配布するHTMLでは、`deliver` が最終acceptance commandです。

   ```bash
   node bin/archify.mjs deliver <type> <candidate.json> <output.html> --quality showcase --json
   ```

   非ゼロの終了コードを成功として扱ってはなりません。配布失敗時は以前の出力が保持されるため、そのpathに対して `visual-check` を実行してはなりません。失敗した候補ではなく、古いlast-good artifactを検査することになるためです。検証が失敗したら、診断された `subject` だけを変更し、`evidence` を検証し、`supportedFixes` から選んで再実行します。客観的error数の最小値が更新されている間は、焦点を絞った修正を続けます。2回連続の修正roundでその最小値が改善しなければ停止し、未解決のdiagnosticを正直に報告してください。

## 更新の通知

この最初の日本語版にはupdate manifestがありません。そのため、同梱checker `scripts/check-update.mjs` は `disabled` を伴う `silent` を返し、ネットワーク要求を行いません。checkに言及せず、依頼されたworkflowを続けてください。

- `silent` の場合、update checkに言及せず続行します。
- `update_available` の場合、installed version、latest version、checkerの固定local summary、公式release-notes linkを含む簡潔な通知を、ユーザーとの会話言語で1つ表示します。`severity` が `security` の場合はsecurity updateであることを明記し、控えめなwarning markerを使います。変わるのは強調だけで、ユーザーの自律性ではありません。インストール済みSkillは変更されておらず、いつ更新するか、そもそも更新するかはユーザーが決めると明記してください。固定されたlocal sentenceは翻訳できますが、remote manifestのsummaryを引用、要約、翻訳してはなりません。通知が表示された後、同じcheckerを `--ack "<eventKey>"` 付きで実行し、その正確な `eventKey` をacknowledgeしてから、ユーザーが最初に依頼したtaskを続けます。

通知は情報であり、許可ではありません。インストール済みversionは変更しないでください。このv0.1 workflowはupdateをdownload、install、executeすることがなく、沈黙は同意ではありません。

最初の候補を作る前に、`renderers/shared/geometry.mjs`、renderer source、validator source、test、benchmarkを読んではなりません。対応していない内部diagnosticがある場合、または焦点を絞った修正が2回失敗した後にだけ、実装を調査します。

Workflow注記: 新しいworkflowにはschema v2を使い、既存sourceに固定legacy geometryが必要な場合はschema v1を維持します。意味を持つedge labelを保ち、compiler diagnosticに従ってください。標準のlayout、pin、migration、receipt契約は [`renderers/workflow/README.md`](renderers/workflow/README.md#layout-contracts) にあります。

Lifecycle注記: phase column `0..4` はmain railを占めます。event/terminal column `N`（`0..2`）はmain column `N + 2` の真下に正確に揃います。回復可能なstateには `type: "failure"` とactive stateへ戻る実際のtransitionを使います。

## 種別の振り分け

| Type | 用途 |
|---|---|
| `architecture` | component、service、cloud/security boundary、infrastructure |
| `workflow` | process、approval gate、tool call、runbook、CI/CD |
| `sequence` | API call chain、request lifecycle、async trace、return |
| `dataflow` | pipeline、ETL/ELT、lineage、governance、consumer |
| `lifecycle` | state/status transition、retry、waiting、terminal state |

曖昧な場合は `node bin/archify.mjs guide "<scenario>" --json` を実行します。scenario proof exampleは構造の参考であり、複製する事実ではありません。

## Mermaid入力

Mermaidからtopologyと意味を読み取り、新しいArchify JSONを作成します。Mermaidのstyleを機械的にrenderしてはなりません。

- `flowchart` / `graph` → `workflow`、またはcomponent mapなら `architecture`。
- `sequenceDiagram` → `sequence`。participantはsemantic participantになり、arrowはmessageになります。
- `stateDiagram` → `lifecycle`。stateとtransitionはMermaidのstyleではなく意味を維持します。

## オーサリングの不変条件

- 明白なmain pathを1本にし、side branchは最も近いmain-path nodeから分岐させます。routing controlを追加する前に、価値の低いedgeを削除してください。
- `meta.visual_preset` は既定で省略し、解決後のcolor modeがlightかdarkかにかかわらず、すべてのダイアグラムが `classic` で開くようにします。color modeとvisual presetは独立しています。Light / Darkの切り替えでは現在のpresetを維持しなければなりません。ユーザーがそのvisual styleを明示的に求めた場合にだけ `signal-flow`、`blueprint`、`editorial` を設定します。
- `meta.subtitle` は既定で省略します。title、node、cardの言い換えとなるsubtitleを決して創作してはなりません。ユーザーが明示的に求めた場合にだけ、短い補足行を1つ含めます。
- standalone desktop viewerは、既定では浅い帯ではなくfirst-screen artifactとして扱います。laptopとexternal display向けにresponsive artifactを1つ生成し、device固有HTMLや別topologyは決して作りません。viewerがlive viewport heightから適応してよいのは外側のreading widthだけです。オーサリング済みSVG/viewBox、比率、semantic geometry、通常のdocument flowを維持しなければなりません。幅広または縦長のdesktopでは、diagram panelと必要なconclusion cardが画面全体を均衡よく占めるだけのvertical rhythmをオーサリングします。runtime scalingでは、圧縮しすぎたY layoutや小さすぎる明示的 `meta.viewBox` を修復できません。引き渡し前に、実際のHTMLを1440×900、1600×1000、1920×1080で開きます。大きなdesktop display向けのcompositionでは2048×1320も確認します。すべての確認サイズで `document.documentElement.scrollWidth <= window.innerWidth` および `scrollHeight <= window.innerHeight` を必須とし、最大viewportでダイアグラムが無理なく読め、縦方向に均衡していることを目視確認します。overflowは、本当に冗長なcontentだけを除くかspacingを詰めることで修正し、node、label、main panelを縮小するのはその後にします。最大viewportでviewerのwidth capより下に不自然な空白帯が残る場合は、オーサリング済みY positionを再配分し、viewBox heightを比例して増やします。穴埋めcopyや装飾cardを追加してはなりません。`overflow: hidden`、contentのclip、diagram内部scroller、引き伸ばしたSVG height、または小さなtypographyで合格を偽装してはなりません。narrow/mobile layoutではcontainmentに必要なら縦scrollを許容できます。
- 正直な `auto` 既定値には `meta.legend` を省略します。必要な場合は `mode: auto|all|hidden` と、rendererが対応する `entries.<kind>.label|visible` だけを使います。labelで意味が変わることはありません。
- 明示されたユーザーの選択からprimary authored languageを1つ選びます。選択がなければ、依頼または会話の主言語に従います。`meta.locale` が制御するのはrenderer所有のViewer UIだけです。対応Viewer言語には `"en"` を使います。それ以外のすべての言語では `meta.locale` を省略し、固定Viewer UIと `<html lang>` がEnglishへfallbackすることを明示します。rendererがauthored contentを翻訳することはありません。詳細は `references/authoring-contract.md` を参照してください。
- 正確な製品名、code identifier、command、protocol、API path、environment nameを維持します。ローカライズされたcopy内でEnglishのままでもかまいませんが、周囲の説明文を別言語のままにする根拠には決してなりません。
- brand identityは任意かつ明示的です。nodeがその実在製品を指す場合は、標準の組み込みIDを `brand` に入れます。一致するpresetがなく、ユーザーが公式HTTP(S) URLを提供した場合は、最初に `node bin/archify.mjs brands capture "<url>" --json` を実行し、返されたdigest固定済み `brand` objectを使います。renderとvalidateは固定されていないcaptureを決して行いません。それ以外では `brand` を省略します。「database」のような曖昧な役割からbrandを推測してはならず、badgeでsemantic `type`、label、relationship factを置き換えてはなりません。
- sequence diagramでは、安定した `fixed` layoutにするため `meta.column_fit` を省略します。幅広いviewBoxで水平方向の未使用spaceが生じる場合、または意味のあるparticipant labelがfixed boxに収まらない場合は `"spread"` にします。`spread` を試す前にsemantic labelを短くしてはなりません。
- component typeは `frontend`、`backend`、`database`、`cloud`、`security`、`messagebus`、`external` です。variantは `default`、`emphasis`、`security`、`dashed` です。
- 関係ラベルは意味を持つデータです。衝突した場合は、labelを移動し、routeまたはspacingを調整し、その後、意味を維持して表現を短くします。両endpointからすでに完全に明白で、protocol、action、direction、synchronous/asynchronous behavior、cross-boundary mechanismを含まない表現だけを省略できます。意味のあるlabelはすべて維持してください。削除はジオメトリ修正ではありません。endpointから完全に明白なため最初からrelationshipをlabelなしにする場合は、表現が冗長な理由を説明します。これはsemantic authoring choiceであり、geometry修正ではありません。
- `meta.engineering_profile` は既定で省略します。region、cluster、security boundaryという表現だけでは有効になりません。ユーザーがproduction deployment topology、ownership handoff、またはfail-closed deployment reviewを明示的に求め、source factが既知の場合にだけ `deployment-ownership` を有効にします。有効にした後は、検証を通すためだけにengineering profileを削除してはなりません。factを修復するか、diagnosticを正直に報告してください。
- spacingとはcenter distanceではなくclear gapです。relationship labelでは、clear gapが測定済みmask widthを超えなければなりません。labelを維持する修正順序に従ってください。
- automatic routeがendpoint sideを所有します。sideはdirection contractです。最初と最後のsegmentは、そのsideに垂直な向きで出入りしなければなりません。
- Automatic Port Spreadはarchitecture、workflow、data-flow、lifecycleにおけるrendererの既定動作です。単一relationship、および明示的 `via`、`channelX`、`channelY`、`labelAt`、または `auto` 以外のrouteでは適用されません。近接したparallel portにはoutside bridgeを使い、自動routingで8px未満のsegmentや16px未満のinterior turnを作れないようにします。architectureではさらに、妨げのない対向automatic port（`left`/`right` または `top`/`bottom`）について、offsetが16px未満かつ両portがcorner clearanceを維持する場合に1本の共有axisへ揃えます。endpointの片方だけがspreadされた場合は、共有されていないendpointだけをそのaxisへ移動できます。両endpointがspreadされた場合はoutside bridgeを維持し、競合portを区別します。
- 関係のないopaque nodeを横切るedge、曖昧なshared corridor、別routeをmaskするrelationship labelを決して受け入れてはなりません。

field enum、spacing計算、geometry修正rule、repository evidence、mode別placementが必要な場合にだけ `references/authoring-contract.md` を読んでください。

## 配布

修正中は `validate` を使い、最終acceptanceには `deliver` を1回使います。配布では、正確な仕様bytesを同じdirectory内のprivate snapshotへ凍結し、そのsnapshotをrenderおよびcheckして、HTMLをatomicにcommitします。仕様と成果物双方のSHA-256とbyte countを報告します。

配布後は、信頼済みHTMLを変更または再renderせず、限定されたdesktop evidenceを収集します。

```bash
node bin/archify.mjs visual-check <output.html> --json
```

`visual-check` は1440×900、1600×1000、1920×1080、2048×1320でcontainmentを測定し、最小と最大のsizeでlight/dark screenshotをcaptureして、成果物の隣にrelative-path contact sheetとJSON sidecarを書き込みます。automated receiptは常に `visualReview: "pending"` を報告します。screenshotはinspection用evidenceであり、自動的なpolish claimではありません。exit 0はcontainmentとcaptureの成功、1はoverflowまたはcapture failure、2はChrome/Chromiumが利用できずreceiptが `skipped` になったことを意味します。このcommandは配布済みHTMLを決して変更しません。

ユーザーが即時のlocal previewを求めた場合にだけ `--open` を加えます。稼働中のdesktop authoring loopでは、任意で次を使えます。

```bash
node bin/archify.mjs preview <type> <input>.json <output>.html --quality showcase
```

既定ではpreviewを開始してはなりません。preview、repository evidence、export receipt、visual review、またはcommit後のopenを使う場合は `references/delivery-contract.md` を読んでください。

## 任意のviewer機能

生成HTMLにはtheme switching、pan/zoom、search、focus、relationship tracing、semantic view、presentation、正直なexportがすでに含まれます。これらはreader機能であり、追加のオーサリング作業ではありません。`meta.animation: "trace"` はopt-inです。`meta.views` は任意で、curated chapterを最大5つまで含めます。

ユーザーがShare Card、Route/Reach card、motion、guided story、deep link、presentation、search/focus、または他のViewer Runtime機能を明示的に求めた場合にだけ `references/viewer-runtime.md` を読んでください。

## セットアップとfallback

Skill package内でのinstallは不要です。次で確認します。

```bash
node bin/archify.mjs doctor
node bin/archify.mjs demo <output-directory>
```

shell accessが利用できない場合は、architecture SVGを `assets/template.html` に手作業で置き、inline colorではなくCSS semantic classを使い、`references/delivery-contract.md` のvisual review契約に従います。

## 出力

検査済みHTML path、diagram type、validation summary、specification/artifact receipt、正直なvisual-review statusを返します。非ゼロcommandを成功と主張したり、実施していないvisual inspectionを実施済みと主張したりしてはなりません。
