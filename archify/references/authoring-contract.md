# オーサリング契約

最短のオーサリング手順で詳細が必要になった後にだけ、このリファレンスを読みます。schemaとexampleが引き続き正本です。

## Schemaの調べ方

mode schemaと `schemas/common.schema.json` の両方を読みます。mode schemaは `$ref` を使うため、共有enumはcommon fileにあります。

- `componentType`: `frontend`、`backend`、`database`、`cloud`、`security`、`messagebus`、`external`
- `variant`: `default`、`emphasis`、`security`、`dashed`
- relationship IDは共有identifier patternを使い、そのcollection内で一意でなければなりません。

fieldを創作してはなりません。構造には最も近いexampleを使い、その後で新しいID、表現、事実、layoutをオーサリングします。

## Workflow layout契約

新しいworkflowにはschema v2を使い、既存sourceが固定geometryを維持しなければならない場合はschema v1を残します。どちらのversionでも `col` は `0..5` の範囲を保ち、意味を持つedge labelをspacing修正として削除してはなりません。absolute coordinateがある場合に `schema_version` だけを変更してはなりません。標準の[migrationおよびlayout-receipt契約](../renderers/workflow/README.md#migration-and-layout-receipt)に従ってください。完全な規範的不変条件はworkflow rendererの[layout契約](../renderers/workflow/README.md#layout-contracts)にあります。

## 凡例契約

正直な既定値には `meta.legend` を省略します。`auto` はtyped IRに存在するsemantic kindだけを一覧表示します。rendererのreferenceには `mode: "all"` を使い、凡例全体を除去するには `mode: "hidden"` を使います。`entries` 配下では、選択したmode schemaが列挙するkeyだけが有効です。各keyは `label`、`visible`、またはその両方を受け付けます。`visible: true` は未使用だが対応済みのconventionを表示でき、`visible: false` はそれを隠します。`hidden` をoverrideすることはできません。

label overrideが変えるのはreader向け表現だけです。文章からkindを推測したり、不足しているnode、state、message、flowを凡例で補ったりしてはなりません。長いlabelは測定され、deterministic rowへwrapします。Architectureの暗黙的automatic viewBoxは、その同じ測定済みfootprintから広がります。後方互換性のため、`meta.legend` のないlegacy documentでは、明示的viewBoxに収まらない暗黙のauto legendを省略できます。typed topologyが変わることはありません。`meta.legend` を追加するとpresentationは意図的かつstrictになります。解決後labelがオーサリング済みviewBoxに収まらない場合は、短くするか隠すか、出力されたdiagnosticに従ってviewBoxを広げます。

## 言語の一貫性

primary authored languageを1つ選びます。ユーザーの明示的な選択が優先されます。選択がなければ依頼の言語、依頼自体が言語中立なら会話の主言語を使います。対応するViewer localeはEnglishです。EnglishのViewer UIには `meta.locale: "en"` を書きます。rendererはdiagram stringから言語を推測せず、オーサリング済みlocaleを使います。省略したdocumentは有効なままで、Englishが既定になります。

`meta.locale` が制御するのはrenderer所有のreader surfaceだけです。対象は `<html lang>`、document-title suffix、既定のSVG descriptionとfocus label、既定のlegend label、固定Viewer control、status、accessibility name、errorです。authored contentを翻訳することはありません。title、subtitle、nodeとrelationshipのcopy、boundary、lane、group、guided view、legend label override、cardには、primary languageを個別に適用します。別言語でオーサリングされたダイアグラムでもEnglishのViewer localeを使います。

`en` 以外の言語を求められた場合、対応していないlocaleを書いてはなりません。reader向けのオーサリング済みstringをすべて依頼言語に保ち、`meta.locale` を省略してrendererが安全にEnglishを使うようにし、固定Viewer UIと `<html lang>` がEnglishのままで成果物が完全にはローカライズされないことをユーザーへ明示します。fallbackが適用されるのはrenderer所有surfaceだけです。authored copyをEnglishへfallbackしてよいことには決してなりません。対応していないlocaleへ黙って置き換えてはなりません。

正確な製品名、code identifier、command、protocol、API path、environment nameをそのまま維持します。ローカライズ済みcopy内でそれらの用語をEnglishのままにできますが、周囲の説明文には選択した言語を使わなければなりません。renderer所有の既定legend labelは `meta.locale` に従います。ダイアグラムに別のdomain表現が必要な場合にだけ `meta.legend.entries.*.label` overrideをオーサリングし、そのoverrideはprimary languageに保ちます。

## Visual presetの既定値

`meta.visual_preset` は既定で省略します。その場合rendererは、lightとdarkの両color modeでダイアグラムを `classic` として開きます。color modeとvisual presetは独立したviewer stateです。Light / Darkの切り替えでは現在のpresetを維持しなければなりません。ユーザーがそのvisual styleを明示的に求めた場合にだけ `signal-flow`、`blueprint`、`editorial` をオーサリングします。

## Engineering profileの既定値

通常のsystem architectureでは `meta.engineering_profile` を省略します。region、cluster、security boundaryという表現だけではengineering profileを有効にしません。ユーザーがproduction deployment topology、ownership handoff、またはfail-closed deployment reviewを明示的に求め、source factが既知の場合にだけ `deployment-ownership` を有効にします。有効にした後は、検証を通すためだけにengineering profileを削除してはなりません。オーサリング済みfactを修正するか、diagnosticを正直に報告してください。

## Title hierarchy

簡潔なtitleを1つ使い、説明はダイアグラム自体に担わせます。`meta.subtitle` は既定で省略し、title、node、edge、cardを言い換えるために決して使いません。ユーザーがsubtitleを明示的に求めた場合にだけ、短い補足行を1つ含めます。subtitleを省略または空にした際、生成viewerに空のvisual rowが残ってはなりません。

## 実行可能なgeometry rule

- node anchorはside midpointから始まります。`left`/`right` はhorizontal endpointを変更し、`top`/`bottom` はvertical endpointを変更します。automatic Architecture relationshipでは、axis offsetが16px未満の妨げられていない対向portについて、両endpointが16pxのcorner gutterを維持する場合に1本のhorizontalまたはvertical axisを共有できます。一方のendpointだけがspread groupに属する場合、共有されていないcounterpartだけが移動します。両endpointでspreadされたrelationshipは、区別されたportとoutside bridgeを維持します。
- sideはdirection contractです。最初と最後のroute segmentは、指定方向へ垂直かつoutward/inwardでなければなりません。
- Automatic Port Spreadはarchitecture、workflow、data-flow、lifecycle diagramにおけるrendererの既定動作です。共有automatic endpointを、16px corner gutterを保ってdeterministicかつsymmetricに広げます。sequence message、単一relationship、明示的 `via`、`channelX`、`channelY`、`labelAt`、または `auto` 以外のrouteには適用されません。
- showcase route rhythmでは、0ではないすべてのsegmentが8px以上、すべてのinterior segmentが16px以上でなければなりません。spread portがほぼparallelの場合、routerは小さなdoglegを作る代わりに、24px endpoint stubと16px outside bridgeを使います。
- shared endpoint corridorは、semantic ambiguityがない場合にだけ許されます。関係のないcollinear overlapが8px以上あるとshowcaseは失敗します。
- container borderは意図されたpass-through geometryですが、長いedgeをstructural borderに沿わせてはなりません。
- 関係のないopaque nodeを横切るedgeは、quality profileにかかわらず常にhard failureです。

### Spacingとlabel

spacing recommendationが意味するのはbox間のclear gapであり、center distanceではありません。width 165pxのnode間でcenter distanceが200pxでも、clear gapは35pxしかありません。

relationship labelには次を必要とします。

```text
clear gap > label mask width + 8px breathing room
label mask width ≈ 6.5px × ASCII units + 13px
CJK characters count as two units
```

関係ラベルは意味を持つデータです。gapが小さすぎる場合はlabelを移動し、routeまたはspacingを調整し、その後、意味を維持して表現を短くします。両endpointからすでに完全に明白で、protocol、action、direction、synchronous/asynchronous behavior、cross-boundary mechanismを含まない表現だけを省略できます。意味のあるlabelはすべて維持してください。削除はジオメトリ修正ではありません。endpointから完全に明白なため最初からrelationshipをlabelなしにする場合は、表現が冗長な理由を説明します。これはsemantic authoring choiceであり、spacing修正ではありません。workflow v2では、診断された `labelAt`、`labelDx`/`labelDy`、`labelSegment` を適用する前に、compilerに測定済みmaskを割り当てさせます。診断済みgeometry controlは一度に1つ適用します。

### 修正順序

1. 欠落または無効な `meta.quality_profile` とschema errorを修正します。
2. node overlapまたは範囲外placementを修正します。
3. edge-through-nodeおよびendpoint-direction errorを修正します。
4. crossing、ambiguous corridor、border run、route rhythmを修正します。
5. label-to-node、label-to-label、label-to-route clearanceの順に修正します。

編集するたびに `validate` を実行します。`diagnostics[]` は、安定した `code`、正確な `subject`、測定済み `evidence`、`supportedFixes` を使って処理します。diagnosticが `labelAt` を返す場合、別のoffsetを見積もらず、そのpointを使います。

## Mode別placement

### Architecture

短いvertical branchを持つleft-to-right spineを1本使います。primary componentは6～12個を優先し、実在するownership、trust、process、deployment boundaryだけをgroup化します。boundaryはrelationshipを置き換えません。

schemaが対応している場合はgrid placementを優先します。free positionは限定的な例外に適し、文章によるcoordinate planningには適しません。事実として正しい場合、external actorをsystem boundaryの外に置きます。

### Workflow

laneはresponsibilityまたはphaseを表します。column `0..5` はlogical progressionを表します。新しいworkflowは `readable-v2` で開始し、legacy geometry compatibilityのためだけに `fixed-v1` を残します。happy pathをmonotonicに保ち、意味を持つedge labelを維持し、retryとexception returnをmain lane corridorの外へrouteします。

### Sequence

participantはconversation role順に並べます。messageがvertical orderを所有します。return/async/security variantは意味のために使い、装飾のために使ってはなりません。sequenceではAutomatic Port Spreadを使いません。

### Dataflow

stageはtransformationまたはcustodyを表します。rowはparallel streamを分けます。明白ではないdata contract、classification、cross-boundary movementだけにlabelを付けます。

### Lifecycle

main phaseはcolumn `0..4`、event bandとterminal bandはcolumn `0..2` を使います。event/terminal column `N` はmain column `N + 2` と同じx coordinateに揃います。回復可能なfailureにはactive stateへ戻る実際のtransitionが必要です。cardやguided viewに「retry」と書くだけではtopologyになりません。

## Repository evidence

architecture diagramが実在するコードを反映しなければならない場合は、オーサリング前にリポジトリのエントリポイント、実行時の境界、ストレージ、トランスポート、デプロイconfigを調査します。実際に検証した証拠だけを記録してください。`--repo-root <path>` はarchitecture専用で、architectureの `render`、`validate`、`deliver`、`preview`、`compare` が受け付けます。workflow、sequence、dataflow、lifecycleでは拒否されます。ファイルの近さや名前だけからruntimeの因果関係を推測してはなりません。

## 手作業placementのfallback

rendererを実行できない場合にだけ使います。`assets/template.html` から始め、semantic CSS classを保ち、inline SVG/accessibility構造を維持し、配布用visual checklistを実行します。dark/light parityを壊すinline literal colorを決して導入してはなりません。
