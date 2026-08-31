# Lifecycle Renderer（ライフサイクル）

`diagram_type: "lifecycle"` のJSON fileを標準Archify HTML templateへrenderします。

```bash
node archify/renderers/lifecycle/render-lifecycle.mjs input.lifecycle.json output.html
```

rendererは同梱standalone validatorを使い、inputを `archify/schemas/lifecycle.schema.json` に対して検証します。dependencyのinstallは不要です。

`output.html` を省略した場合、rendererはJSON fileの `meta.output` を使い、それもなければ現在のworking directoryに `lifecycle.html` を出力します。

## 入力

Lifecycle JSON fileには次を設定しなければなりません。

```json
{
  "schema_version": 1,
  "diagram_type": "lifecycle",
  "meta": {
    "title": "Agent Run Lifecycle",
    "viewBox": [980, 660]
  },
  "lanes": [],
  "states": [],
  "transitions": [],
  "cards": []
}
```

lane idはsemanticかつ予約済みです。id `main` のlaneが必須で、上側phase bandに対応します。`terminal` は下側outcome bandに対応します。それ以外のすべてのlane id（合計最大4 lane）は、中央のevent band 1つを共有します。3つのband headerにはauthorのlane labelが使われ、中央bandはすべてのevent lane labelを ` + ` で結合します。完全なworked exampleは `archify/examples/agent-run.lifecycle.json` にあります。

schemaは次にあります。

```text
archify/schemas/lifecycle.schema.json
```

## 凡例

既定のlegendは `states[].type` からkindを導出します。対応する `meta.legend.entries` keyは、安定した順序で `start`、`active`、`waiting`、`decision`、`success`、`failure`、`neutral`、`external` です。共有legend契約によってlabelとvisibilityをoverrideできます。render済みstateに裏付けられたkindだけがSemantic Legend controlを受け取ります。

## Layout budget

| Band | Lane id | Top y | Column center | 既定state |
|------|---------|-------|----------------|---------------|
| Phase | `main`（必須） | 126 | `col` 0～4 → x = 94, 248, 402, 556, 710 | 118×62 |
| Event | その他任意のid | 278 | `col` 0～2 → x = 402, 556, 710 | 126×58 |
| Outcome | `terminal` | 450 | `col` 0～2 → x = 402, 556, 710 | 118×58 |

event columnとterminal columnはmain railから意図的にoffsetされています。event/terminalの `col: N` はmainの `col: N + 2` と同じx coordinateを使います。たとえばlower-band column 0、1、2は、それぞれmain column 2、3、4の下に揃います。

| 定数 | 値 |
|----------|-------|
| viewBox | 既定 `[980, 660]`、schema最小 `[420, 566]` |
| State area | xは `[32, width − 32]` 内、state bottomは `height − 122` 以下 |
| State spacing | 任意の2 state間で10px以上。すべてのevent laneが1 bandを共有するためlaneをまたいで検査します。同じbandのstateは `col` または `yOffset` で分離します |
| Transition length | endpoint間32px以上 |
| Legend row | 最終baseline y = height − 36、測定済みの追加rowは上方向へwrap |

primary lifecycle railはphase bandに沿って走り、使用中の最も遠いphase columnまで伸びます。transitionのroute presetは `straight`、`drop`（`channelY` で曲がる。既定はvertical midpoint）、`bottom-channel`、`top-channel`、`right-channel`、`left-channel`、明示的 `via` point、または既定の `auto` です。multi-segment transitionにはrounded cornerが付き、`cornerRadius`（既定10、sharp bendには `0`）で調整できます。

## Design rule

- lifecycle diagramをdense state-transition graphではなくphase mapとして扱います。
- primary lifecycleを `main` lane上のhorizontal rail 1本に置きます。
- `01`、`02`、`03` のようなordered phaseには `step` labelを使います。
- lower laneはinterruption、recovery、terminal exitにだけ使います。
- transition labelが必須でない限りmain SVGから除き、node label、tag、legend entry、summary cardを優先します。
- diagonal lineとcrossing lineを避けます。可能ならterminal exitはsource eventから垂直に下ろします。
- completionには `success`、failure/terminal exitには `failure`、pauseには `waiting`、quality gateには `decision` を使います。

schema violationは、elementのidまたはlabelを注記したpath-prefix付きmessageを出して非ゼロで終了します。rendererはさらに、検出可能なlayout問題で失敗します。対象にはmissing `main` lane、duplicate state ID、unknown lane、unknown transition endpoint、lifecycle area外のstate、overlapping state（lane間を含む）、stateまたは他labelと衝突するlabel、stateより広いlabel、短すぎて読めないtransition、関係のないstateを横切るtransition（2px Clean Flow clearance）が含まれます。Lifecycle bandは意図的なpass-through containerのままです。text widthはCJK-awareに見積もられ、fullwidth glyphは2 unitとして数えます。

洗練された配布には `meta.quality_profile` を `showcase` に設定します。その場合、関係のないproper X crossingは `composition/proper-crossing` で失敗します。既定の `standard` ではartifact-receipt warningに留まります。最終artifact checkはrounded `Q` cornerをsampleします。collinear corridorはproper-X ruleの対象外ですが、関係のないtransitionが8px以上overlapすると、別gateが `standard` でwarning、`showcase` でfailureにします。shared semantic endpoint、point touch、より短いoverlapは有効です。showcaseはさらに、8px未満のroute segmentと16px未満のinterior turn segmentを拒否します。通常の8～15px endpoint stubは有効です。
