# Archify JSON IR Schema（スキーマ）

型付きrendererはそれぞれ、layout処理を始める前に、このfolder内のschemaの1つで検証されたJSON中間表現（IR）を受け取ります。

## ファイル

| Schema | 対象 | 構造array |
|--------|---------|-------------------|
| `workflow.schema.json` | `diagram_type: "workflow"` | `lanes`, `phases`, `groups`, `mainPath`, `nodes`, `edges` |
| `sequence.schema.json` | `diagram_type: "sequence"` | `participants`, `segments`, `messages`, `activations` |
| `dataflow.schema.json` | `diagram_type: "dataflow"` | `stages`, `nodes`, `flows` |
| `lifecycle.schema.json` | `diagram_type: "lifecycle"` | `lanes`, `states`, `transitions` |
| `architecture.schema.json` | `diagram_type: "architecture"` | `components`, `boundaries`, `connections` |
| `common.schema.json` | 共有 `$defs` のみ（top-level documentなし） | — |

すべてのdiagram schemaには、`schema_version`、`diagram_type`、`meta`（`title` を含む）、および構造arrayが必要です。ただし `segments`、`activations`、`cards` は任意です。すべての階層で `additionalProperties: false` を設定するため、未知のfieldは黙って無視されず拒否されます。

すべての `meta` objectは、生成HTMLでopt-inのSVG/CSS motionを使う `animation: "trace"` も受け付けます。既定のstatic outputには省略するか `"none"` を設定します。また、`locale: "en"` も受け付けます。このfieldは、固定Viewer UI、renderer所有の既定legendおよびaccessibility copy、document-title suffix、`<html lang>` 値を選びます。オーサリング済みstringを翻訳するものではありません。省略するとlegacy behaviorを維持し、Englishへ解決されます。対応していないlocale valueは推測または黙って書き換えられず、schema validationに失敗します。

`visual_preset` は `classic`（安定した既定値）、`signal-flow`（発光するmotion-forward presentation）、`blueprint`（high-contrast engineering review）、`editorial`（暖色のpublication-style design reviewとdocumentation）を受け付けます。presetが変えるのはviewer styleだけで、semantic IDやgeometryは変更しません。

Sequenceの `meta` は追加で `column_fit` を受け付けます。既定の `fixed` は従来の108px column gapと86px participant boxを維持するため、オーサリング済みダイアグラムはviewBoxの幅にかかわらず同じcoordinateでrenderされます。`spread` は代わりにviewBoxからgapとbox widthを導出し、幅広canvasの右側を空白にせずcolumn distanceとlabel roomへ変えます。どちらでもlane order、ID、message semanticsは変わりません。

また、guided `views` を最大5つまで含められます。各viewは一意の `id`、reader向け `label`、既存semantic node IDからなる空でない `focus` list、任意の短い `note` を持ちます。

### 凡例presentation契約

すべての `meta` objectは、そのrendererですでに選択されたschema versionを変更せず、同じ任意legend shapeを受け付けます。

```json
"legend": {
  "mode": "auto",
  "entries": {
    "security": { "label": "restricted data", "visible": true }
  }
}
```

`mode` は `auto`（既定値）、`all`、`hidden` です。`auto` はtyped IRに存在するkindだけを含み、`all` はrendererの安定した全catalogを含み、`hidden` は凡例全体を除去してentry overrideより優先されます。明示的な `viewBox` のないArchitecture documentでは、最終SVG layoutに使う解決済みlegend footprintと同じ測定結果から、viewBoxを自動で決めます。

すべてのrendererで、`meta.legend` を省略するlegacy documentはcompatibility-safeな暗黙の `auto` を使います。解決済みlegendが明示的なオーサリング済みviewBoxにoverlapなしで収まらない場合、Archifyは以前は有効だったschema-v1 documentをhard failureに変えず、凡例全体を省略します。authorが `meta.legend` を追加すると（明示的 `mode: "auto"` を含む）、layoutは意図的なものとなり、収まらないlabelまたはbandはpath-prefix付きdiagnosticで失敗します。entryは空でない上限付き `label`、boolean `visible`、またはその両方を設定できます。`visible: false` は解決済みentryを除去し、`visible: true` は対応済みだが未使用のkindをvisual legendへ強制的に加えます。未知のkindおよびpropertyはstrict validationに失敗します。

対応keyはrendererが所有します。

| Renderer | `meta.legend.entries` key |
|---|---|
| Architecture | `frontend`, `backend`, `database`, `cloud`, `security`, `messagebus`, `external` |
| Workflow | `frontend`, `backend`, `security`, `messagebus`, `database`, `cloud`, `external` |
| Sequence | `emphasis`, `return`, `security`, `dashed`, `default` |
| Dataflow | `emphasis`, `security`, `dashed`, `database`, `default` |
| Lifecycle | `start`, `active`, `waiting`, `decision`, `success`, `failure`, `neutral`, `external` |

labelはpresentation専用です。安定したkindをrenameしたり、node/relationshipを変更したり、Semantic Lensのedge factを作ったりしません。Sequence messageとDataflow flow-variant entryはvisual keyです。正確なcompiled node factに裏付けられたcomponent/state entryには、対話型Semantic Legend bridgeが付きます。実在する `nodes[].type: "database"` factがある場合のDataflow `database` も対象です。

すべてのrelationship collection（`connections`、`edges`、`messages`、`flows`、`transitions`）は、共有ID patternを使う任意のauthor-controlled `id` を受け付けます。rendererはsource-order runtime keyを別に維持し、オーサリング済みIDはarray reorder後も有効なstable `#relation=<id>` viewer linkを実現します。IDのないdocumentも有効で、そのrelationship pinは現在のpage内に留まります。

すべてのsemantic node collection（`components`、`nodes`、`participants`、`states`）は、任意の `brand` も受け付けます。`archify brands --json` が返すcanonical string、または `archify brands capture <url> --json` が返すdigest固定済み `{ "url", "sha256" }` objectのいずれかです。既知IDと既知brand domainは同梱vector catalogueを使います。未知URLは、オーサリング前にその明示commandでcaptureしなければなりません。renderとvalidateは固定されていないnetwork captureを決して実行しません。unsafe、unavailable、changed、unsupported contentはbrand diagnostic付きでfail closedします。`brand` を省略すると従来のoutputを維持します。

## schema_version方針

Workflowはschema version 1と2に対応します。version 1は固定layoutのcompatibility contractとして残り、version 2は可読性workflow compilerを有効にし、`archify migrate workflow ... --to-schema 2` で明示的に生成できます。他の4種類のdiagram schemaでは `schema_version` を `1` に固定します。

Workflowは任意の `semanticChecks` も受け付けます。`allowedRoots` と `allowedTerminals` は意図されたgraph sourceとsinkの集合を閉じます。`requiredEdges` は正確なオーサリング済みrelationshipを必須にし、`requiredPaths` は中間nodeを許しつつdirected reachabilityを必須にします。compilerはlayout前にこれらのfactを評価し、型付き `workflow/*` diagnosticを返します。このfieldはadditiveかつgeometry-neutralです。省略すると既存workflow behaviorを維持し、満たされた契約を含めてもSVGまたはlayout-receipt bytesは変わりません。

現在validなfileは、その宣言versionの範囲内で2.x release lineを通してvalidationとrenderingが有効であり続けなければなりません。additiveなviewer、accessibility、presentation改善は生成HTMLを強化できますが、オーサリング済みIRを再解釈したり、以前はvalidだったprofileなしv1 fileを新たなhard layout failureに変えたりしてはなりません。breaking IR changeには新versionが必要です。additiveで後方互換性のあるfieldには不要です。

## 共有定義（common.schema.json）

5つのdiagram schemaは `common.schema.json#/$defs/...` を参照します。

- `id` — element identifier。patternは `^[a-zA-Z][a-zA-Z0-9_-]*$`
- `point` — numberの `[x, y]` pair（`via` と `labelAt` で使用）
- `componentType` — `frontend`、`backend`、`database`、`cloud`、`security`、`messagebus`、`external`
- `locale` — 上限付きrenderer locale、`en`
- `brandMark` — 任意の組み込みbrand ID 1つ、または明示的HTTP(S) site URL
- `variant` — `default`、`emphasis`、`security`、`dashed`（sequence messageではlocalに `return` を追加）
- `legendMode` と `legendEntry` — renderer所有の各key mapで使う、共有のstrict modeおよびlabel/visibility override shape
- `guidedViews` — `meta.views` が受け付ける上限付きread-only reader path
- `cards` — SVGの下にrenderされるsummary-card block

Lifecycle stateの `type` はmode固有（`start`/`active`/`waiting`/...）で、`lifecycle.schema.json` に留まります。

## Runtime validation

開発時に `scripts/generate-validators.mjs` は、ajvのdraft 2020-12 standalone generatorを `strict: true` および `allErrors: true` で使い、5つすべてのschemaをcompileします。生成された `renderers/shared/generated-validators.mjs` はcommitされ、Skillとともに配布されるため、runtime validationにはnpmもnetwork dependencyもありません。`renderers/shared/validator.mjs` は、renderer固有のlayout checkより先に対応するstandalone validatorを適用します。

共有loaderは続けて、JSON Schemaだけではここで簡潔に表現できないcross-collection factを確認します。duplicate view ID、duplicate focus ID、diagramのsemantic collectionに存在しないfocus ID、modeのrelationship collection内で重複するオーサリング済みrelationship IDです。

Architectureはさらに、opt-inでrevision固定済みのrepository evidenceに対応します。`meta.repository` はpublic GitHub URLと完全なcommit SHAを指定し、componentはrepo-relative POSIX path、任意のline range、任意のlabelを持つ `sources` を1～3個保持できます。shapeはschemaで検査され、その後rendererが `--repo-root` を要求します。local Git originが一致し、Gitがcommit、blob、要求lineを証明しなければなりません。検証済みevidenceはSemantic PassportとNode Finder向けにcanonical SVG外へ埋め込まれます。通常documentとvisual exportはrepository evidenceを保持しません。

## Visual品質とengineering上の真実性

`meta.quality_profile` と `meta.engineering_profile` は別の問いに答えます。`quality_profile` は5つすべてのmodeで利用でき、Archifyがcompositionをどれだけstrictに判定するかを制御します。`engineering_profile` はArchitecture専用の任意semantic contractです。省略すると通常のv1 behaviorを維持します。

最初のengineering profileは `deployment-ownership` です。ユーザーがfail-closed deployment reviewを求め、source factが既知の場合にだけ有効にします。すべてのnon-external componentが `tag` にownerを指定し、正確に1つの `region` に属することが必要です。documentには `region` と `security-group` boundaryの両方が必要です。すべての `database` は `security-group` 内になければなりません。各security groupには1つの共有regionからのmemberだけを含めます。regionまたはsecurity-group membershipが変わるすべてのconnectionは、実際のcrossing mechanismを `label` に指定しなければなりません。

profileが検証するのはオーサリング済みIRだけです。infrastructureを発見したり、ownerを推測したり、ダイアグラムがlive environmentと一致することを証明したりしません。factが不明なら、創作せず、profileを未設定にするかfactを取得します。

`npm test` はgeneratorをcheck modeで実行し、commit済みvalidatorがschemaからdriftしている場合に失敗します。

## Error形式

schema violationは非ゼロで終了します。各ajv errorは1行ずつ、instance path、最も近いenclosing elementの `id` または `label`、message、parameterの順で報告されます。

```text
workflow schema validation failed:
  /nodes/3 (id/label: "router") must NOT have additional properties {"additionalProperty":"colour"}
```

schemaが捕捉するのはshape error（type、enum、range、unknown field）です。overlapやlabel collisionなどのgeometry問題はrendererが担当します。
