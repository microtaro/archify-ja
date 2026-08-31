# Sequence Renderer（シーケンス）

`diagram_type: "sequence"` のJSON fileを標準Archify HTML templateへrenderします。

```bash
node archify/renderers/sequence/render-sequence.mjs input.sequence.json output.html
```

rendererは同梱standalone validatorを使い、inputを `archify/schemas/sequence.schema.json` に対して検証します。dependencyのinstallは不要です。

`output.html` を省略した場合、rendererはJSON fileの `meta.output` を使い、それもなければ現在のworking directoryに `sequence.html` を出力します。

## 入力

Sequence JSON fileには次を設定しなければなりません。

```json
{
  "schema_version": 1,
  "diagram_type": "sequence",
  "meta": {
    "title": "Cache Miss Request Sequence",
    "viewBox": [920, 760]
  },
  "participants": [],
  "segments": [],
  "messages": [],
  "activations": [],
  "cards": []
}
```

timelineはviewBox heightに合わせてscaleします。高い `meta.viewBox` はmessage roomを増やし、低いviewBoxはclipする代わりにreadable bandを縮めます。完全なworked exampleは `archify/examples/cache-miss-request.sequence.json` にあります。

schemaは次にあります。

```text
archify/schemas/sequence.schema.json
```

## 凡例

既定のvisual legendは `messages[].variant` からkindを導出します（`variant` を省略すると `default`）。対応する `meta.legend.entries` keyは、安定した順序で `emphasis`、`return`、`security`、`dashed`、`default` です。これらはvisual message keyであり、Semantic Lens controlではありません。label/visibility overrideでedge factを作ることはありません。

## Layout budget

| 定数 | 値 |
|----------|-------|
| viewBox | 既定 `[920, 760]`、schema最小 `[480, 480]` |
| Participant box | `fixed`（既定）: 86×54、y 72。`spread`: viewBox-relative width 86px～190px |
| Participant column | `fixed`: center x = 62 + index×108。`spread`: 利用可能なviewBox width全体へcolumnを分配 |
| Participant count | 最後のboxがwidth − 40以前で終わらなければならない。収まらないlayoutはfail closed |
| Lifeline | y 142からheight − 65まで。band heightは120px以上 |
| Message `y` range | `[160, height − 83]` |
| Message spacing | horizontal spaceを共有するmessage間でvertical 28px以上 |
| Arrow span | 2 participant間でhorizontal 60px以上 |
| Segment | `to > from` となるy pixel rangeで、`[72, lifeline bottom + 20]` 内 |
| Legend row | y = height − 54 |

`segments[].from/to` と `activations[].from/to` はparticipant idではなくy pixel coordinateです。activationにも `to > from` が必要です。

### Column fit

Sequence diagramでは `meta.column_fit: "fixed"` が既定で、既存documentの従来coordinateを維持します。幅広viewBoxで右側が空白になる場合、または意味のあるparticipant labelがfixed 86px boxに収まらない場合は `"spread"` を使います。Spreadはparticipant order、lifeline、message semanticsを維持しながら、viewBoxからbox widthとcolumn distanceを導出します。

## Design rule

- readerがたどるstory順にparticipantを上部へ並べます。
- 時間は下方向へ進みます。
- main request pathには `emphasis` を使います。
- auth、consent、permission、policy callには `security` を使います。
- 控えめなresponse messageには `return` を使います。
- async trace、event、logging、non-blocking workには `dashed` を使います。
- segmentは薄いbackground guideとして使い、segment labelを短く保ちます。
- labelを簡潔に保ちますが、fixed boxに収めるためだけに意味のあるparticipant labelを短くする前に `meta.column_fit: "spread"` を試します。

schema violationは、elementのidまたはlabelを注記したpath-prefix付きmessageを出して非ゼロで終了します。rendererはさらに、検出可能なlayout問題で失敗します。対象にはmissing participant、duplicate participant ID、boxより広いparticipant label、unknown message endpoint、readable timeline外のmessage、水平方向にoverlapするmessage間で狭すぎるvertical spacing、無効なsegmentまたはactivation range、viewBoxを超えるparticipantが含まれます。共有Clean Flow契約はparticipant headerをsemantic boxとして扱う一方、messageが中間lifeline、activation bar、segment frameを横切ることを明示的に許します。text widthはCJK-awareに見積もられ、fullwidth glyphは2 unitとして数えます。

洗練された配布には `meta.quality_profile` を `showcase` に設定します。その場合、関係のないproper message X crossingは `composition/proper-crossing` で失敗します。既定の `standard` ではartifact-receipt warningに留まります。messageは引き続き中間lifelineを横切れます。collinear corridorはproper-X ruleの対象外ですが、関係のないmessageが8px以上overlapすると、別gateが `standard` でwarning、`showcase` でfailureにします。shared semantic endpoint、point touch、より短いoverlapは有効です。showcaseはさらに、8px未満のroute segmentと16px未満のinterior turn segmentを拒否します。通常の8～15px endpoint stubは有効です。
