# Workflow Renderer（ワークフロー）

`diagram_type: "workflow"` のJSON fileを標準Archify HTML templateへrenderします。

```bash
node archify/renderers/workflow/render-workflow.mjs input.workflow.json output.html
```

rendererは同梱standalone validatorを使い、inputを `archify/schemas/workflow.schema.json` に対して検証します。dependencyのinstallは不要です。

`output.html` を省略した場合、rendererはJSON fileの `meta.output` を使い、それもなければ現在のworking directoryに `workflow.html` を出力します。

render後、artifact checkerを実行します。

```bash
node archify/scripts/check-render-output.mjs output.html
```

これはbrowserで最も見つけやすいfinal-SVG問題を捕捉します。non-finite SVG value、意図しないtwo-point diagonal arrow、凡例を横切るarrowです。

## 入力

Workflow JSON fileには次を設定しなければなりません。

```json
{
  "schema_version": 2,
  "diagram_type": "workflow",
  "meta": {
    "title": "Agent Tool Call Workflow"
  },
  "lanes": [],
  "phases": [],
  "groups": [],
  "mainPath": [],
  "nodes": [],
  "edges": [],
  "cards": []
}
```

新しいworkflowには `schema_version: 2` を使います。その可読性layout compilerは、すべての `col` を `0..5` のlogical rankとして扱い、測定済みdocumentからgeometryを導出します。`schema_version: 1` は既存source向けの固定legacy contractとして残ります。有効なv1 outputはbyte-for-byteで維持され、黙ってv2として再解釈されることはありません。

通常のv2 caseでは `meta.viewBox` を省略し、compilerがintrinsic measured boundを使えるようにします。v1でwidthを省略した場合は720に固定され、heightはlane countから導出されます。完全なworked exampleは `archify/examples/agent-tool-call.workflow.json` にあります。その `schema_version` が適用契約を選びます。

schemaは次にあります。

```text
archify/schemas/workflow.schema.json
```

<a id="migration-and-layout-receipt"></a>
## Migrationとlayout receipt

既存v1 sourceを別のv2 fileへmigrateします。

```bash
node archify/bin/archify.mjs migrate workflow old.json new.json --to-schema 2 --json
```

schema-v2 outputを新しいsourceとして同じcommandをもう一度実行すると、idempotent verification passになります。destination bytesとgeometryは変わりません。

commandは既定でsourceを上書きしません。legacyのabsolute `via[*][0]`、`labelAt[0]`、`channelX` valueをsolved rank spaceへmapし、報告されたvertical constraintにauthorのinputが必要な場合を除いてy coordinateを維持します。曖昧さのないcontainment修正に限って明示的viewBoxを広げ、v2 compilationとartifact checkが合格した後にだけdestinationを書き込みます。曖昧なexplicit pinはdestinationを生成せず失敗します。

author向けの安定したv2 planを次で調べます。

```bash
node archify/bin/archify.mjs validate workflow input.workflow.json --layout-json
```

receiptは選択されたcontract、測定済み `viewBox` と `requiredViewBox`、solved column、node、edge、label、causal diagnosticを報告します。solver iterationとcandidate scoreは意図的に省略します。

## 凡例

既定のlegendは `nodes[].type` からcomponent kindを導出します。対応する `meta.legend.entries` keyは、安定した順序で `frontend`、`backend`、`security`、`messagebus`、`database`、`cloud`、`external` です。共有legend契約によってlabelとvisibilityをoverrideできます。render済みnodeに裏付けられたkindだけがSemantic Legend controlを受け取ります。

<a id="layout-contracts"></a>
## Layout契約

### Fixed v1

| 定数 | 値 |
|----------|-------|
| viewBox | 既定 `[720, auto]` — auto height = 52 + lanes×104 + (lanes−1)×20 + 124 |
| Lane frame | x 40、width 640、height 104、gap 20、最初のlane topはy 52 |
| Lane title strip | 各laneの上部30px。node boxはその下に置かなければならない |
| Column center（`col` 0～5） | x = 88, 220, 300, 430, 500, 625 |
| Phase header | 任意の `phases[]` を最初のlane上にrenderし、`fromCol..toCol` にまたがる |
| Lane group | 任意の `groups[]` が1 lane内のparallel workまたはbranch workを囲む |
| Exception lane | retry、denial、fallback、failure pathには `lane.variant: "exception"` を設定 |
| Main path lint | 任意の `mainPath[]` がhappy-path stepに対応edgeがあり、後退しないことを確認 |
| 既定node | 92×52（`tag` 設定時はheight 68） |
| Node spacing | 同じlaneのnode間で8px以上 |
| Edge length | straight segmentは28px以上 |
| Legend row | y = lane bottom + 44、viewBox heightはlegend y + 18以上 |

column-center gapは132 / 80 / 130 / 70 / 125 pxです。column 1↔2（80px）と3↔4（70px）では、同じlane内に既定width 92pxのnodeを両方置けません。そのような無効v1 sourceは、causalな `workflow/column-capacity` diagnostic 1件と検証済みmigration-to-v2修正を受け取ります。v1がadaptive layoutへfall throughすることはありません。

### Readable v2

| 不変条件 | 契約 |
|----------|----------|
| Logical column | `col` は `0..5` のinteger、pixel centerは測定済みoutput |
| Adjacent-rank baseline | document固有constraintを適用する前のcenter distance 120px |
| Same-lane node clearance | vertical node intervalがoverlapする場合8px以上 |
| Facing direct edge | clear gapは `max(28px, measured label mask width + 8px)` 以上 |
| Automatic route rhythm | direct segment 28px以上、endpoint stub 8px以上、interior turn segment 16px以上 |
| Implicit viewBox | intrinsic content bound + contract padding |
| Explicit viewBox | containment capacity。不足inputは正確な `requiredViewBox` とcontributorを報告 |

compilerは実際に関連するnodeまたはoverlapするsame-lane nodeにだけconstraintを適用します。そのため、関係のないlaneにある幅広nodeがすべてのrankを広げることはありません。legacy centerはcorrectness constraintの後に使うsoft preferenceであり、geometry promiseではありません。phase frameとgroup frameはsolved rank bandから導出されます。automatic routeは1回だけnormalizeされ、validationとSVG serializationは同じfinal sceneを使います。長いautomatic labelは、すべてのdownstream rankを広げる代わりに、direct-gutter growthとlegal channelを比較します。測定済みmulti-row legendはintrinsic heightとexplicit viewBox capacityに関与します。

オーサリング済み `via`、`labelAt`、`channelX`、`channelY` は、v2ではabsolute hard pinです。実行不能なpinは黙って移動せず `workflow/explicit-pin-conflict` を返します。`fromSide` と `toSide` はdirection constraintのままです。route presetはautomatic candidate familyを制限しますが、それ自体はabsolute coordinate pinではありません。endpoint sideのどちらかを省略すると、v2 compilerは実行可能なsideを選びます。オーサリング済みsideはそのendpointを指定portに制限します。

## Design rule

- ownershipまたはruntime boundaryにlaneを使います。
- Intake、Plan、Execute、Reportのようなhigh-level story beatにphase headerを使います。
- 1 lane内のparallel check、branch handling、限定作業にgroupを使います。すべてのgroupにはnodeを1つ以上含めなければなりません。
- human wait、denial、retry、fallback、failure laneには、happy pathへ混在させず `lane.variant: "exception"` を使います。
- 明確なhappy pathがある場合は `mainPath` を設定します。rendererは連続するidに対応edgeがあり、left-to-rightに進むことを検証します。
- raw SVG coordinateではなく、lane IDと `0..5` の `col` indexでnodeを配置します。
- 意味を持つedge labelを維持します。Readable v2は測定済みlabel clearanceを割り当てます。labelが収まらない場合は意味を削除せず、報告されたcapacityまたはroute constraintを修正します。
- endpointから完全には明白でないdecision、approval、protocol、async trace、return path、その他のrelationship meaningにはlabelを使います。
- raw `via` pointより先にroute presetを使います。`drop`（lane間で曲がる。0～1の `bias` が位置を選択）、`outside-right`、`return-left`、`bottom-channel`、`up-channel` です。それ以外には `straight` と既定の `auto` を使います。
- 狭いchat/browser previewでも適切にrenderできる簡潔さをworkflow exampleに保ちます。

### 任意のsemantic check

layout validationでは、labelやcardからdomain truthを推測できません。source evidenceがroot、terminal、必須のdirect relationship、または必須のdirected reachabilityを確立する場合は、それらのfactを `semanticChecks` にencodeします。

```json
"semanticChecks": {
  "allowedRoots": ["request", "resource_catalog"],
  "allowedTerminals": ["reply", "audit_log"],
  "requiredEdges": [
    { "from": "dispatch", "to": "dispatch_ledger" }
  ],
  "requiredPaths": [
    { "from": "event_ledger", "to": "runtime_host" }
  ]
}
```

`allowedRoots` または `allowedTerminals` がある場合、それぞれzero-incoming nodeまたはzero-outgoing nodeに対する完全なallow listです。`requiredEdges` は正確なオーサリング済みdirection 1つを必須にします。`requiredPaths` は中間nodeを許しつつ、オーサリング済みedge directionに従います。これらのcheckはlayout前に実行し、SVGまたはreceipt bytesを変更しません。routeまたはcomposition diagnosticを解決するためだけに弱めてはなりません。domain factが不明なfieldは省略します。

schema violationは、elementのidまたはlabelを注記したpath-prefix付きmessageを出して非ゼロで終了します。rendererはさらに、検出可能なlayout問題で失敗します。対象にはnode overlap、lane外のnode、無効なphase/group column range、empty group、壊れた `mainPath` step、unknown edge target、nodeまたは他labelと衝突するlabel、nodeより広いlabel、viewBox外のlegend、短すぎて明瞭に読めないstraight arrowが含まれます。共有Clean Flow Gateも2px clearanceで関係のないnodeを横切るedgeを拒否します。lane、phase、groupは意図的なpass-through containerのままです。text widthはCJK-awareに見積もられ、fullwidth glyphは2 unitとして数えます。

diagnosticはcausalです。rank-capacity failureは派生するshort edge、endpoint-direction、label-overlap findingを抑制します。各 `supportedFixes[]` entryは、提案editをreplanして検証されます。labelの存在がfailed invariantの原因でない場合、diagnosticがsemantic labelの削除を提案することはありません。

洗練された配布には `meta.quality_profile` を `showcase` に設定します。その場合、関係のないproper X crossingは `composition/proper-crossing` で失敗します。既定の `standard` ではartifact-receipt warningに留まります。collinear lane corridorはproper-X ruleの対象外ですが、関係のないedgeが8px以上overlapすると、別gateが `standard` でwarning、`showcase` でfailureにします。shared semantic endpoint、point touch、より短いoverlapは有効です。showcaseはさらに、8px未満のroute segmentと16px未満のinterior turn segmentを拒否します。fixed lane gapでは、通常の8～15px endpoint stubは有効です。
