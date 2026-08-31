# 配布契約

## 検証と配布

候補を編集するたびに `validate` を使います。候補を凍結した後にだけ、最終的なatomic配布を実行します。

```bash
node bin/archify.mjs deliver <type> <candidate.json> <output.html> --quality showcase --json
```

Deliverは仕様を1回読み、その正確なbytesを同じdirectory内のprivate candidate snapshotへ書き込み、そのsnapshotをrenderして完全なartifact checkerを実行し、すべてのartifact checkが合格した後にだけtargetを置き換えます。JSON receiptには `specification` と `artifact` 双方のSHA-256とbyte countが含まれます。renderer、checker、receipt、commitのいずれかが失敗した場合は非ゼロで終了し、private stateを削除し、以前の信頼済みartifactを保持し、openerを決して起動しません。

現在の候補に対する `deliver` がexit 0になった後にだけ `visual-check` を実行します。配布が失敗し、output pathがすでに存在する場合、そのpathは以前の信頼済みartifactを指したままです。その時点で `visual-check` を実行すると、却下された候補ではなく古いoutputを測定・captureすることになります。新しいvisual evidenceを集める前に、配布diagnosticを報告し、sourceを修正してください。

deterministic receiptが証明するのはbyte identityとautomated checkです。deterministic receiptにvisual reviewが含まれると決して主張してはなりません。

## 自動visual evidence

配布後、信頼済みHTMLを再renderまたは変更せず、その正確なHTMLを検査します。

```bash
node bin/archify.mjs visual-check <output.html> --json
```

このzero-dependency commandはDevTools pipe経由でChrome/Chromiumを使います。light themeのcontainmentを1440×900、1600×1000、1920×1080、2048×1320で測定し、次にlight/dark screenshotを1440×900と2048×1320でcaptureします。4つのPNG sidecar、relative-path HTML contact sheet、JSON receiptを成果物の隣に書き込みます。receiptはsource artifactのSHA-256とbyte countをbindし、READおよびStill runtime stateを記録し、常に `visualReview: "pending"` と報告します。automated evidenceはperceptual reviewを主張できません。

exit 0はすべてのcontainment測定とcaptureが成功したことを意味します。exit 1はoverflowまたはcapture failureです。exit 2はChrome/Chromiumが利用できず、receipt statusが `skipped` であることを意味します。captureが失敗またはskipした場合は、以前のevidenceを最新として提示しないよう、古いimage/contact-sheet sidecarを削除します。

## 任意のopen

ユーザーが即時のlocal previewを求めた場合にだけ `--open` を加えます。これはatomic commitの後に実行され、引数配列を1つ使うOS openerを5秒の上限付きで呼び出し、`open.status` を記録します。CI、unattended agent、non-interactive environmentでは無効のままにしてください。openが失敗またはunsupportedでも配布は無効になりません。そのstatusが証明するのはlocal opener invocationが成功したかどうかだけです。

## Last-Good Live Preview

稼働中のdesktop authoring loopでだけ使います。

```bash
node bin/archify.mjs preview <type> <input>.json <output>.html --quality showcase
```

Previewはloopback上で明示されたinput 1つをwatchし、安定したdigestごとにprivate snapshotへbindして、既存の検証済み配布pipelineが合格した後にだけ進みます。無効、書き込み途中、削除済み、または置換済みのinputがあっても、以前の検証済みrevisionを画面とdiskに残します。同一bytesではrebuildもreloadも行いません。

preview runtimeはzero-dependency Skill ZIP内に同梱され、`node_modules` なしで動作しなければなりません。

既定で開始してはなりません。CI、unattended agent、remote sharing、mobileで使ってはなりません。`--no-open` は、表示されたlocal URLを自分で開くユーザーまたはloop testのためだけに使います。引き渡し前にCtrl-Cで停止します。server state、port、source path、diagnostic、error text、reload tokenを、生成成果物やexportへ決して入れてはなりません。

## 知覚的な配布gate

automated validationではvisual polishを証明できません。deterministic delivery後、実際のHTMLを対応browserで調べるか、image readerでscreenshotをrenderして検査します。変更した場合は両theme、既定READ view、line crossing/corridor、label mask、node/card fit、focus/search/passport closure、export cleanlinessを確認します。

既定のstandalone desktop viewerでは、1440×900、1600×1000、1920×1080を測定します。大きなdesktop display向けの成果物では、2048×1320も測定します。first-screen合格には、すべての確認sizeで `document.documentElement.scrollWidth <= window.innerWidth` および `scrollHeight <= window.innerHeight` が必要です。最大viewportでは、不自然な下部の空白帯がないか、render済みcompositionを検査します。main panelと必要なconclusion cardは、浅い帯へ潰れず、利用可能なheightを均衡よく使う必要があります。desktop viewportがoverflowする場合は、本当に冗長なcontentだけを除くかspacingを詰めてオーサリング済みcompositionを修正した後に、node、label、main panelを縮小します。measurementを通すためにoverflowを隠す、contentをclipする、diagram内部scrollerを導入する、node/label typographyを小さくする、といったことをしてはなりません。narrow/mobile containmentでは縦方向のpage scrollを残せます。

次の正直なstatusを正確に1つ報告します。

- `visual_review: passed` — render済み成果物を検査した後にだけ使います。
- `visual_review: skipped (image reader unavailable)` — 対応するvisual surfaceがない場合に使います。
- `visual_review: failed` — 具体的に見えるdefectを添えます。

`correction_rounds: 0`、`correction_rounds: 1`、`correction_rounds: 2` のいずれかを使います。修正roundは最大2回で、2回を超えてはなりません。成果物を検査せずに `visual_review: passed` と報告してはなりません。

visual reviewで候補を変更した場合、以前の凍結済みspecification receiptは最新ではないため、validationとdeliveryをもう一度実行しなければなりません。

## 引き渡しreceipt

次を返します。

```text
diagram_type: architecture|workflow|sequence|dataflow|lifecycle
output: /absolute/path/to/file.html
specification_sha256: <receipt value>
artifact_sha256: <receipt value>
validation: 9/9 showcase, 0 errors, 0 warnings
visual_review: passed|skipped (image reader unavailable)|failed
correction_rounds: 0|1|2
```

open、preview status、Share Card、その他のviewer exportはvalidation claimではありません。
