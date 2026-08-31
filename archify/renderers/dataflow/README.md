# Data Flow Renderer（データフロー）

`diagram_type: "dataflow"` のJSON fileを標準Archify HTML templateへrenderします。

```bash
node archify/renderers/dataflow/render-dataflow.mjs input.dataflow.json output.html
```

rendererは同梱standalone validatorを使い、inputを `archify/schemas/dataflow.schema.json` に対して検証します。dependencyのinstallは不要です。

`output.html` を省略した場合、rendererはJSON fileの `meta.output` を使い、それもなければ現在のworking directoryに `dataflow.html` を出力します。

## 入力

Data-flow JSON fileには次を設定しなければなりません。

```json
{
  "schema_version": 1,
  "diagram_type": "dataflow",
  "meta": {
    "title": "Product Analytics Data Flow",
    "viewBox": [940, 720]
  },
  "stages": [],
  "nodes": [],
  "flows": [],
  "cards": []
}
```

完全なworked exampleは `archify/examples/product-analytics.dataflow.json` にあります。

schemaは次にあります。

```text
archify/schemas/dataflow.schema.json
```

## 凡例

既定のvisual legendは `flows[].variant` からkindを導出し（`variant` を省略すると `default`）、database nodeが存在する場合にだけ `database` を追加します。対応する `meta.legend.entries` keyは、安定した順序で `emphasis`、`security`、`dashed`、`database`、`default` です。このsliceではArchifyにcompiled edge-kind factがないため、flow variantはvisual-onlyのままです。存在する `database` entryは異なります。正確な `nodes[].type: "database"` factから作られるため、通常のSemantic Legend count、accessible name、keyboard interactionを公開します。database nodeなしで `database` をvisibleに強制した場合はvisual-onlyのままです。

## Layout budget

| 定数 | 値 |
|----------|-------|
| viewBox | 既定 `[940, 720]`、schema最小 `[360, 360]` |
| Stage（2～5） | center x = 100 + stage×215、stage band width 168、header y 46 |
| Row top（`row` 0～4） | y = 128, 242, 356, 470, 584（`yOffset` を加算） |
| 既定node | 112×58 |
| Node area | xは `[24, width − 24]` 内、yは `[104, height − 74]` 内 |
| Node spacing | 任意の2 node間で10px以上（stageとrowをまたいで検査） |
| Flow length | endpoint間34px以上 |
| Legend row | y = height − 36 |

flowのroute presetは `straight`、`vertical-channel`、`bottom-channel`、`top-channel`、明示的 `via` point、または既定の `auto`（midpoint elbow）です。

## Design rule

- data lifecycle boundary（source、ingest、process、store、consume）にstageを使います。
- stage indexとrow indexでnodeを配置し、通常のcaseではraw SVGを手作業で配置してはなりません。
- flow labelにはtransport primitiveではなくdata asset名を使います。例: `clickstream`、`identity map`、`normalized facts`、`feature vectors`。
- 短いsensitivityまたはgovernance contextには `classification` を使います。例: `PII touch`、`non-PII`、`approved only`、`batch`、`read-only`。
- PII、policy、consent、access-control、restricted joinには `security` を使います。
- primary data pathには `emphasis`、asyncまたはbatch derivationには `dashed` を使います。
- 狭いpreviewに収まるようlabelを短く保ちます。

schema violationは、elementのidまたはlabelを注記したpath-prefix付きmessageを出して非ゼロで終了します。rendererはさらに、検出可能なlayout問題で失敗します。対象にはmissing stage、duplicate node ID、readable diagram area外のnode、node overlap、nodeまたは他labelと衝突するlabel、nodeより広いlabel、unknown flow endpoint、missing flow label、短すぎて読めないflow、関係のないnodeを横切るflow（2px Clean Flow clearance）、viewBoxを超えるstageが含まれます。stage frameは意図的なpass-through containerのままです。text widthはCJK-awareに見積もられ、fullwidth glyphは2 unitとして数えます。

洗練された配布には `meta.quality_profile` を `showcase` に設定します。その場合、関係のないproper X crossingは `composition/proper-crossing` で失敗します。既定の `standard` ではartifact-receipt warningに留まります。collinear stage corridorはproper-X ruleの対象外ですが、関係のないflowが8px以上overlapすると、別gateが `standard` でwarning、`showcase` でfailureにします。shared semantic endpoint、point touch、より短いoverlapは有効です。showcaseはさらに、8px未満のroute segmentと16px未満のinterior turn segmentを拒否します。通常の8～15px endpoint stubは有効です。
