# Viewer Runtimeリファレンス

ユーザーがreader向け機能を求めた場合にだけ、このリファレンスを読みます。通常の生成では、これらの機能を実装し直したり文書化し直したりする必要はありません。生成HTMLにすでに含まれています。

## 探索

- Diagram Guideは現在のactionとshortcutを一覧表示します。
- Reading Depthは既定の100% scaleでREADから始まり、175%でFULL detailを表示し、100%未満の場合だけMAPへ戻ります。focus、story、route、semantic interactionは、scaleにかかわらず正確なfactを表示します。
- Semantic Lensは、オーサリング済みgeometryを変更せず、選択したnode/relationship kindを要約します。
- Intent Traceは、focusを確定する前にfine-pointerまたはkeyboard targetをpreviewします。
- Node Finderはlabelとstable IDを検索します。
- Semantic Passportはfocus時に開き、オーサリング済みupstream/downstream factを表示し、copy可能なdeep linkを提供します。明示的なclose actionを持ち、本当のoutside activationとEscapeで閉じ、canonical exportには決して入りません。
- Semantic Radarはvisible viewportとオーサリング済みgraphを反映しますが、第二のsource of truthにはなりません。
- Direct Relationship Pinは、オーサリング済みlineと安定したrelationship identityを維持しながら、一意のcompiled relationshipを操作可能にします。source/target/label/ID metadataが競合する場合はfail closedしなければなりません。
- Route Probeは、オーサリング済みdirected relationship上で正確に2つのendpointを解決します。geometryからrouteを推測することはありません。

## Guided viewとstory

`meta.views` は、stable node IDを使うcurated chapterを最大5つ定義できます。Named Chapter Rail、Chapter Delta Preview、Story Beat Navigator、Story Follow Camera、Story Director Strip、Story Horizon、Shareable Story Moment linkはすべて、その1つのオーサリング済みarrayから派生します。並行したtopologyやlayoutを所有するものはありません。

story transitionが分類するのは、隣り合うオーサリング済みstop間の正確なrelationshipだけです。forward、reverse、multiple、またはgrouped/no direct linkです。proximity、kind、story orderからtransitive edge、verb、causality、runtime behaviorを決して推測してはなりません。playbackはreaderが開始し、上限付きで、stale-safeかつmotion-governedです。

## Motionとpresentation

`meta.animation: "trace"` は、readerが制御する有限のLive/Still traceを有効にします。staticが既定です。Still、reduced motion、page hiding、print、canonical exportでは、完全なstatic meaningを維持します。Presentation Stageが変更するのはviewer chromeとframingであり、オーサリング済みgeometryではありません。これはmobile product機能ではなく、narrow layoutではcontainmentだけを提供します。

## Canonical export

export menuでは、ダイアグラム全体のPNGをcopy/downloadし、JPEG/WebPをdownloadし、dual-theme SVGをdownloadし、trace-enabled WebMをrecordできます。Viewer state（Guide、Lens、finder、focus、route、story、camera、radar、presentation、motion ownership、temporary overlay）はcanonical exportから除去しなければなりません。

### Share Card

任意の1200×630 Share Card PNGは、README、release、social、launch preview用です。現在のthemeとvisual presetを使い、croppingなしで完全なcanonical diagramを含み、validationを主張することはありません。clipboard image writeに対応している場合、Copy Share Cardは同じcanonical PNGを再利用します。

### Route Share Card

実際のdirected Route Probeが解決した後、readerは **Export → Route Share Card** を使えます。正確なordered route snapshotと共有Share Card seamを再利用します: `format=share-card`、`variant=route`。isolated cloneが使えるのはstaticな `data-share-route-*` decorationだけです。download-onlyであり、stale/unreachable/conflicting routeではfail closedし、canonical artifactにはなりません。

### Reach Share Card

空でないオーサリング済みreachability queryの後、readerは **Export → Reach Share Card** を使えます。traversalを再実行せず、すでに解決済みのupstream/downstream nodeおよびedge setを使います: `format=share-card`、`variant=reach`。isolated cloneが使えるのはstaticな `data-share-reach-*` decorationだけです。download-onlyです。impact、blast radius、breakage、runtime causalityではなく、authored reachabilityと呼んでください。

## 真実性の境界

Viewer exportはcommunication assetです。検査済みHTML、deterministic delivery receipt、実際のvisual reviewを置き換えるものではありません。これらのviewer専用機能のためにhosted service、storage surface、dependency、schema branch、mobile product surfaceを追加してはなりません。
