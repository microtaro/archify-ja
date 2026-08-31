# CLI メッセージ英日レビュー表

英語 CLI source を正本として、human-facing usage、diagnostic、error、supportedFixes を直接日本語化した対照表です。command、option、path、数値、JSON field、diagnostic code は翻訳対象に含めません。各セルは補間変数と空白を厳密に比較できるよう JSON 文字列で記載しています。

| key | English source | Japanese |
| --- | --- | --- |
| `artifact.failed-check` | "Final artifact failed {check}." | "最終成果物が {check} に合格しませんでした。" |
| `artifact.failed-code` | "Final artifact failed {code}." | "最終成果物が {code} に合格しませんでした。" |
| `artifact.unclassified` | "Final artifact check failed without a classified diagnostic." | "最終成果物の検査に失敗しましたが、診断を分類できませんでした。" |
| `brands.capture-fallback` | "Run \"archify brands capture <url> --json\", then use the returned digest-pinned brand value." | "\"archify brands capture <url> --json\" を実行し、返された digest 固定の brand 値を使用してください。" |
| `brands.no-match` | "No built-in brand matched \"{query}\". Run \"archify brands capture <url> --json\", then use the returned digest-pinned brand value." | "組み込み brand に \"{query}\" と一致するものがありません。\"archify brands capture <url> --json\" を実行し、返された digest 固定の brand 値を使用してください。" |
| `common.receipt` | "receipt {path}" | "receipt {path}" |
| `compare.base-validation` | "Base snapshot failed validation: {reason}" | "base スナップショットの検証に失敗しました: {reason}" |
| `compare.candidate-directory` | "Could not create compare candidate: {reason}" | "比較候補を作成できませんでした: {reason}" |
| `compare.cleanup-warning` | "Warning: could not remove compare staging directory: {reason}" | "警告: 比較用ステージングディレクトリを削除できませんでした: {reason}" |
| `compare.commit-failed` | "Architecture Delta pair commit failed; the previous files were restored." | "Architecture Delta の一対の確定に失敗しました。以前のファイルは復元されました。" |
| `compare.commit-rollback-failed` | "Architecture Delta pair commit failed and its previous files could not be fully restored." | "Architecture Delta の一対の確定に失敗し、以前のファイルを完全には復元できませんでした。" |
| `compare.commit-target` | "Could not commit Architecture Delta: existing {label} target is not a regular file." | "Architecture Delta を確定できませんでした: 既存の {label} 出力先が通常ファイルではありません。" |
| `compare.fix.install-package` | "install the complete Archify skill package" | "完全な Archify Skill パッケージをインストールしてください" |
| `compare.fix.receipt-directory` | "choose a --receipt path in the same directory as output.html" | "output.html と同じディレクトリの --receipt パスを選択してください" |
| `compare.fix.regular-file` | "choose a regular-file path for the {label}" | "{label} には通常ファイルのパスを選択してください" |
| `compare.fix.restore-paths` | "restore safe output paths and retry" | "安全な出力パスを復元してから、もう一度実行してください" |
| `compare.fix.safe-output` | "choose a safe output path and retry" | "安全な出力パスを選択してから、もう一度実行してください" |
| `compare.fix.safe-receipt` | "choose a safe receipt path and retry" | "安全な receipt パスを選択してから、もう一度実行してください" |
| `compare.fix.writable-pair` | "check that both output paths are writable regular files, then retry" | "両方の出力パスが書き込み可能な通常ファイルであることを確認してから、もう一度実行してください" |
| `compare.head-validation` | "Head snapshot failed validation: {reason}" | "head スナップショットの検証に失敗しました: {reason}" |
| `compare.internal` | "Architecture compare failed before commit." | "確定前にアーキテクチャ比較が失敗しました。" |
| `compare.output-directory` | "Could not create compare output directory: {reason}" | "比較出力ディレクトリを作成できませんでした: {reason}" |
| `compare.read-base` | "Could not read base input: {reason}" | "base 入力を読み込めませんでした: {reason}" |
| `compare.read-head` | "Could not read head input: {reason}" | "head 入力を読み込めませんでした: {reason}" |
| `compare.receipt-directory` | "The compare receipt must be written beside the HTML artifact." | "比較 receipt は HTML 成果物と同じディレクトリに書き込む必要があります。" |
| `compare.rollback-remove` | "{label}: remove failed ({reason})" | "{label}: 削除に失敗しました（{reason}）" |
| `compare.rollback-restore` | "{label}: restore failed ({reason})" | "{label}: 復元に失敗しました（{reason}）" |
| `compare.runtime-unavailable` | "Architecture compare runtime is unavailable." | "アーキテクチャ比較の実行環境を使用できません。" |
| `compare.snapshot-check-failed` | "Validated snapshot failed final artifact checks." | "検証済みスナップショットが最終成果物の検査に合格しませんでした。" |
| `compare.success` | "compared architecture {output}" | "architecture を比較しました: {output}" |
| `compare.summary` | "{passed}/{count} checks; completeness {completeness}; {proofLevel}; sha256 {sha256}" | "{passed}/{count} 検査、完全性 {completeness}、{proofLevel}、sha256 {sha256}" |
| `compare.target-html` | "HTML artifact" | "HTML 成果物" |
| `compare.target-receipt` | "receipt" | "receipt" |
| `delivery.artifact-preserved` | "Final artifact check failed; the previous artifact was preserved." | "最終成果物の検査に失敗しました。以前の成果物は保持されています。" |
| `delivery.candidate-unreadable` | "Could not read the verified delivery candidate: {reason}" | "検証済み配布候補を読み込めませんでした: {reason}" |
| `delivery.cleanup-warning` | "Warning: could not remove delivery staging directory \"{directory}\": {reason}" | "警告: 配布用ステージングディレクトリ \"{directory}\" を削除できませんでした: {reason}" |
| `delivery.commit` | "Could not commit verified delivery \"{output}\": {reason}" | "検証済み配布 \"{output}\" を確定できませんでした: {reason}" |
| `delivery.engineering-pass` | "; engineering {profile}: pass" | "、engineering {profile}: 合格" |
| `delivery.evidence-incomplete` | "Rendered source evidence receipt is incomplete." | "レンダリング済みソース証跡の receipt が不完全です。" |
| `delivery.evidence-invalid` | "Could not read the repository evidence receipt: {reason}" | "リポジトリ証跡の receipt を読み込めませんでした: {reason}" |
| `delivery.fix.replaceable-target` | "choose a replaceable file target on the same writable filesystem" | "同じ書き込み可能なファイルシステム上で置換可能なファイル出力先を選択してください" |
| `delivery.fix.writable-directory` | "choose a writable output directory" | "書き込み可能な出力ディレクトリを選択してください" |
| `delivery.fix.writable-target-filesystem` | "choose a writable output directory on the target filesystem" | "出力先と同じファイルシステムにある書き込み可能な出力ディレクトリを選択してください" |
| `delivery.freeze-specification` | "Could not freeze the delivery specification: {reason}" | "配布仕様を固定できませんでした: {reason}" |
| `delivery.open-failed` | "Could not open the verified artifact ({status}). Open it manually: {output}" | "検証済み成果物を開けませんでした（{status}）。手動で開いてください: {output}" |
| `delivery.opened` | "opened {output}" | "開きました: {output}" |
| `delivery.prepare-candidate` | "Could not create a delivery candidate beside \"{output}\": {reason}" | "\"{output}\" と同じ場所に配布候補を作成できませんでした: {reason}" |
| `delivery.prepare-directory` | "Could not create delivery directory \"{directory}\": {reason}" | "配布ディレクトリ \"{directory}\" を作成できませんでした: {reason}" |
| `delivery.read-input` | "Could not read delivery input \"{input}\": {reason}" | "配布入力 \"{input}\" を読み込めませんでした: {reason}" |
| `delivery.receipt-invalid` | "Could not parse the successful artifact-check receipt: {reason}" | "成功した成果物検査の receipt を解析できませんでした: {reason}" |
| `delivery.success` | "delivered {type} {output}" | "{type} を配布しました: {output}" |
| `delivery.summary` | "{passed}/{count} artifact checks; composition {profile}: {status}{engineering}; sha256 {sha256}" | "成果物検査 {passed}/{count}、composition {profile}: {status}{engineering}、sha256 {sha256}" |
| `demo.create-directory` | "Could not create demo directory \"{directory}\": {reason}" | "デモ用ディレクトリ \"{directory}\" を作成できませんでした: {reason}" |
| `demo.next` | "Next: open the HTML in your browser, then render your own diagram:" | "次: HTML をブラウザーで開き、その後で独自のダイアグラムをレンダリングします:" |
| `demo.ready` | "Demo ready: {output}" | "デモを用意しました: {output}" |
| `diagnostic.fix-label` | "Fix:" | "修正:" |
| `doctor.authoring-references` | "Progressive authoring references" | "段階的な作成ガイド" |
| `doctor.compare-runtime` | "Architecture compare runtime and proof fixtures" | "アーキテクチャ比較の実行環境と証跡用データ" |
| `doctor.core-template` | "Core template" | "コアテンプレート" |
| `doctor.example-renderer` | "Example renderer" | "サンプルレンダラー" |
| `doctor.file-missing.one` | "{count} required file missing" | "必要なファイルが {count} 件ありません" |
| `doctor.file-missing.other` | "{count} required files missing" | "必要なファイルが {count} 件ありません" |
| `doctor.heading` | "Archify doctor" | "Archify 診断" |
| `doctor.node` | "Node.js v{version} (requires >=18)" | "Node.js v{version}（18 以上が必要）" |
| `doctor.node-required` | "Node.js 18 or newer is required" | "Node.js 18 以上が必要です" |
| `doctor.not-ready` | "Archify is not ready: {problems}." | "Archify を使用できません: {problems}。" |
| `doctor.output-path-runtime` | "Output path safety runtime" | "出力パス安全性の実行環境" |
| `doctor.preview-runtime` | "Live preview runtime" | "ライブプレビュー実行環境" |
| `doctor.ready` | "Archify is ready." | "Archify を使用できます。" |
| `doctor.renderer-bundle` | "{type} renderer, schema, and example" | "{type} のレンダラー、スキーマ、サンプル" |
| `doctor.runtime-failed.one` | "{count} runtime check failed" | "実行時検査が {count} 件失敗しました" |
| `doctor.runtime-failed.other` | "{count} runtime checks failed" | "実行時検査が {count} 件失敗しました" |
| `doctor.scenario-guide` | "Scenario recipe guide" | "シナリオレシピガイド" |
| `doctor.validators` | "Standalone schema validators" | "スタンドアロンのスキーマ検証器" |
| `doctor.visual-check-runtime` | "Visual-check runtime" | "visual-check 実行環境" |
| `error.inspect-architecture-only` | "inspect is currently supported for architecture diagrams only." | "inspect は現在 architecture ダイアグラムでのみ使用できます。" |
| `error.lang-values` | "--lang must be \"en\" or \"zh\"." | "--lang には \"en\" または \"zh\" を指定してください。" |
| `error.layout-json-types` | "--layout-json is currently supported for architecture and workflow diagrams only." | "--layout-json は現在 architecture と workflow ダイアグラムでのみ使用できます。" |
| `error.quality-required` | "--quality requires standard or showcase." | "--quality には standard または showcase が必要です。" |
| `error.receipt-required` | "--receipt requires a JSON output path." | "--receipt には JSON 出力パスが必要です。" |
| `error.repo-root-architecture-only` | "--repo-root is currently supported for architecture diagrams only." | "--repo-root は現在 architecture ダイアグラムでのみ使用できます。" |
| `error.repo-root-required` | "--repo-root requires a repository path." | "--repo-root にはリポジトリパスが必要です。" |
| `error.to-schema-required` | "--to-schema requires a schema version." | "--to-schema にはスキーマバージョンが必要です。" |
| `error.unknown-command` | "Unknown command \"{command}\"." | "不明なコマンド \"{command}\"。" |
| `error.unknown-diagram-type` | "Unknown diagram type \"{type}\". Expected one of: {types}" | "不明なダイアグラム種類 \"{type}\" です。次のいずれかを指定してください: {types}" |
| `error.unknown-option` | "Unknown {command} option \"{option}\"." | "不明な {command} オプション \"{option}\"。" |
| `error.unknown-quality` | "Unknown quality profile \"{quality}\". Expected standard or showcase." | "不明な品質プロファイル \"{quality}\" です。standard または showcase を指定してください。" |
| `fix.ambiguous-corridor` | "adjust route/via or channel coordinates so unrelated relationships do not visually merge" | "無関係な関係線が視覚的に合流しないよう、route/via または channel の座標を調整してください" |
| `fix.container-border-run` | "route across the frame perpendicularly through a clear opening" | "空いている開口部を通り、枠と直交するようにルートを設定してください" |
| `fix.desktop-readability` | "reduce the viewBox width, shorten node copy, widen affected nodes, or split the diagram so node context remains at least 6px at a 1440px desktop viewport" | "1440px のデスクトップ表示でノードのコンテキストが 6px 以上になるよう、viewBox の幅を縮める、ノード文を短くする、対象ノードを広げる、またはダイアグラムを分割してください" |
| `fix.finite-svg` | "replace non-finite coordinates before rendering again" | "もう一度レンダリングする前に、有限でない座標を置き換えてください" |
| `fix.label-route-clearance` | "adjust labelAt, labelDx, labelDy, labelSegment, message y, or the other relationship route" | "labelAt、labelDx、labelDy、labelSegment、message y、または他の関係線ルートを調整してください" |
| `fix.legend-clearance` | "move the route or enlarge the viewBox so relationships do not enter the legend" | "関係線が凡例に入らないよう、ルートを移動するか viewBox を拡大してください" |
| `fix.micro-segment` | "move the route/channel/via point so every visible segment is at least 8px" | "表示される各線分が 8px 以上になるよう、route/channel/via の点を移動してください" |
| `fix.orthogonal-arrows` | "use renderer-supported orthogonal routing controls" | "レンダラーが対応する直交ルーティング制御を使用してください" |
| `fix.proper-crossing` | "adjust route/via or channel coordinates so unrelated relationships use separate corridors" | "無関係な関係線が別々の経路を使うよう、route/via または channel の座標を調整してください" |
| `fix.short-interior-segment` | "move the route/channel/via point so every interior turn has at least 16px" | "内部の各折れ線が 16px 以上になるよう、route/channel/via の点を移動してください" |
| `fix.single-svg` | "remove additional SVG roots so the artifact contains exactly one diagram SVG" | "成果物にダイアグラム SVG が 1 つだけ含まれるよう、余分な SVG ルートを削除してください" |
| `guide.load-failed` | "Could not load the scenario recipe guide: {reason}" | "シナリオレシピガイドを読み込めませんでした: {reason}" |
| `guided-view.duplicate-semantic-id` | "{path} duplicates semantic id {id}" | "{path} でセマンティック ID {id} が重複しています" |
| `guided-view.duplicate-view-id` | "{path} duplicates view id {id}" | "{path} で表示 ID {id} が重複しています" |
| `guided-view.unknown-semantic-id` | "{path} references unknown semantic id {id}" | "{path} が不明なセマンティック ID {id} を参照しています" |
| `guided-view.validation-failed` | "Guided view validation failed" | "ガイド表示の検証に失敗しました" |
| `i18n.invalid-message` | "Invalid Archify i18n message {key} for {locale}" | "Archify の i18n メッセージ {key} は {locale} で無効です" |
| `i18n.missing-cli-message` | "CLI message key {key} is not defined" | "CLI メッセージキー {key} は定義されていません" |
| `i18n.missing-message` | "Missing Archify i18n message {key} for {locale}" | "Archify の i18n メッセージ {key} が {locale} にありません" |
| `input.json-parse.fix` | "repair the JSON syntax and run validation again" | "JSON の構文を修正してから、もう一度検証してください" |
| `input.json-parse.message` | "Input JSON could not be parsed: {reason}" | "入力 JSON を解析できませんでした: {reason}" |
| `input.read.fix` | "provide one readable JSON input file" | "読み取り可能な JSON 入力ファイルを 1 つ指定してください" |
| `input.read.message` | "Input could not be read: {reason}" | "入力を読み込めませんでした: {reason}" |
| `migration.alias-before-commit` | "Workflow migration source and destination resolved to the same file before commit." | "確定前に workflow の移行元と移行先が同じファイルへ解決されました。" |
| `migration.cleanup-warning` | "Warning: could not remove workflow migration staging directory \"{directory}\": {reason}" | "警告: workflow 移行用ステージングディレクトリ \"{directory}\" を削除できませんでした: {reason}" |
| `migration.commit` | "Could not commit the verified workflow migration." | "検証済み workflow 移行を確定できませんでした。" |
| `migration.destination-type` | "Workflow migration destination must be a regular file path." | "workflow の移行先は通常ファイルのパスでなければなりません。" |
| `migration.distinct-files` | "Workflow migration source and destination must be different files." | "workflow の移行元と移行先には別のファイルを指定する必要があります。" |
| `migration.fix.commit` | "choose a writable regular-file destination and retry" | "書き込み可能な通常ファイルの移行先を選択してから、もう一度実行してください" |
| `migration.fix.destination-directory` | "choose a writable destination directory" | "書き込み可能な移行先ディレクトリを選択してください" |
| `migration.fix.destination-type` | "choose a destination path that is absent or names a regular file" | "存在しないパス、または通常ファイルを示す移行先パスを選択してください" |
| `migration.fix.distinct-files` | "choose a different destination path and keep the source unchanged" | "別の移行先パスを選択し、移行元を変更せず保持してください" |
| `migration.fix.path-preflight` | "remove unsafe path aliases or choose a different destination path" | "安全でないパス別名を削除するか、別の移行先パスを選択してください" |
| `migration.fix.report` | "report the source workflow and this diagnostic to the Archify maintainers" | "移行元 workflow とこの診断を Archify メンテナーへ報告してください" |
| `migration.fix.retry-destination` | "choose a different destination path and retry" | "別の移行先パスを選択してから、もう一度実行してください" |
| `migration.fix.stable-source` | "retry the migration from a stable workflow source file" | "安定した workflow 移行元ファイルから、もう一度移行してください" |
| `migration.path-preflight` | "Could not verify that the workflow migration paths are distinct." | "workflow 移行元と移行先が別のパスであることを確認できませんでした。" |
| `migration.prepare-destination` | "Could not prepare the workflow migration destination." | "workflow の移行先を準備できませんでした。" |
| `migration.source-changed` | "Workflow migration source changed while the destination was being verified." | "移行先の検証中に workflow の移行元が変更されました。" |
| `migration.success-v1` | "migrated workflow schema v1→v2: {source} → {destination}" | "workflow schema v1→v2 を移行しました: {source} → {destination}" |
| `migration.success-v2` | "verified workflow schema v2 migration: {source} → {destination}" | "workflow schema v2 の移行を検証しました: {source} → {destination}" |
| `migration.unclassified` | "Workflow migration failed without a classified diagnostic." | "workflow 移行が失敗しましたが、診断を分類できませんでした。" |
| `migration.unexpected` | "Workflow migration failed unexpectedly." | "workflow 移行が予期せず失敗しました。" |
| `preview.load-failed` | "Could not load live preview: {reason}" | "ライブプレビューを読み込めませんでした: {reason}" |
| `preview.start-failed` | "Could not start live preview: {reason}" | "ライブプレビューを開始できませんでした: {reason}" |
| `relationship.duplicate-id` | "{path} duplicates relationship id {id}" | "{path} で関係 ID {id} が重複しています" |
| `relationship.validation-failed` | "Relationship identity validation failed" | "関係 ID の検証に失敗しました" |
| `renderer.unknown-diagram-type` | "writeDiagram: unknown diagram type {type}" | "writeDiagram: 不明なダイアグラム種類 {type}" |
| `runtime.renderer-process` | "Renderer process could not start." | "レンダラープロセスを開始できませんでした。" |
| `runtime.renderer-unclassified` | "Renderer failed before emitting a structured diagnostic." | "レンダラーが構造化診断を出力する前に失敗しました。" |
| `schema.additional-properties.fix` | "remove unsupported property {property}" | "未対応のプロパティ {property} を削除してください" |
| `schema.additional-properties.message` | "{path} must NOT have additional properties {details}" | "{path} に未対応のプロパティを含めることはできません {details}" |
| `schema.enum.fix` | "choose one of {values}" | "{values} のいずれかを選択してください" |
| `schema.enum.message` | "{path} must be equal to one of the allowed values {details}" | "{path} は許可された値のいずれかでなければなりません {details}" |
| `schema.max-items.fix` | "provide at most {limit} item(s)" | "{limit} 項目以下を指定してください" |
| `schema.max-items.message` | "{path} must NOT have more than {limit} items {details}" | "{path} は {limit} 項目以下でなければなりません {details}" |
| `schema.max-length.fix` | "provide at most {limit} character(s)" | "{limit} 文字以下を指定してください" |
| `schema.max-length.message` | "{path} must NOT have more than {limit} characters {details}" | "{path} は {limit} 文字以下でなければなりません {details}" |
| `schema.maximum.fix` | "use a value {comparison} {limit}" | "{comparison} {limit} の値を使用してください" |
| `schema.maximum.message` | "{path} must be {comparison} {limit} {details}" | "{path} は {comparison} {limit} でなければなりません {details}" |
| `schema.min-items.fix` | "provide at least {limit} item(s)" | "{limit} 項目以上を指定してください" |
| `schema.min-items.message` | "{path} must NOT have fewer than {limit} items {details}" | "{path} には {limit} 項目以上が必要です {details}" |
| `schema.min-length.fix` | "provide at least {limit} character(s)" | "{limit} 文字以上を指定してください" |
| `schema.min-length.message` | "{path} must NOT have fewer than {limit} characters {details}" | "{path} は {limit} 文字以上でなければなりません {details}" |
| `schema.minimum.fix` | "use a value {comparison} {limit}" | "{comparison} {limit} の値を使用してください" |
| `schema.minimum.message` | "{path} must be {comparison} {limit} {details}" | "{path} は {comparison} {limit} でなければなりません {details}" |
| `schema.pattern.fix` | "match the required pattern {pattern}" | "必須パターン {pattern} に一致させてください" |
| `schema.pattern.message` | "{path} must match pattern {pattern} {details}" | "{path} はパターン {pattern} に一致しなければなりません {details}" |
| `schema.required.fix` | "add required property {property}" | "必須プロパティ {property} を追加してください" |
| `schema.required.message` | "{path} must have required property {property} {details}" | "{path} に必須プロパティ {property} がありません {details}" |
| `schema.type.fix` | "use {type} at {path}" | "{path} には {type} を使用してください" |
| `schema.type.message` | "{path} must be {type} {details}" | "{path} の型は {type} でなければなりません {details}" |
| `schema.validation-failed` | "{type} schema validation failed:" | "{type} のスキーマ検証に失敗しました:" |
| `usage.architecture-only` | "architecture only" | "architecture のみ" |
| `usage.brands-capture` | "Usage: archify brands capture <url> [--json]" | "使い方: archify brands capture <url> [--json]" |
| `usage.brands-query` | "name, alias, domain, or category" | "名前、別名、ドメイン、またはカテゴリ" |
| `usage.guide-argument` | "scenario or question" | "シナリオまたは質問" |
| `usage.heading` | "Usage:" | "使い方:" |
| `usage.migrate` | "Usage: archify migrate workflow <old.json> <new.json> --to-schema 2 [--json]" | "使い方: archify migrate workflow <old.json> <new.json> --to-schema 2 [--json]" |
| `usage.output-directory` | "output-directory" | "出力ディレクトリ" |
| `usage.types` | "Types:" | "種類:" |
| `validate.checker-unparseable` | "Artifact checker failed without a parseable receipt." | "成果物検査器が解析可能な receipt を出力せずに失敗しました。" |
| `validate.engineering-pass` | "; engineering {profile}: pass" | "、engineering {profile}: 合格" |
| `validate.final-check-failed` | "Final artifact check failed." | "最終成果物の検査に失敗しました。" |
| `validate.success` | "ok {type} {input} ({checks} artifact checks; composition {profile}: {errors} errors, {warnings} warnings{engineering})" | "ok {type} {input}（成果物検査 {checks} 件、composition {profile}: エラー {errors} 件、警告 {warnings} 件{engineering}）" |
| `visual-check.contact-sheet` | "contact sheet {path}" | "contact sheet {path}" |
| `visual-check.failed` | "visual-check failed: {reason}" | "visual-check に失敗しました: {reason}" |
| `visual-check.load-failed` | "Could not load visual-check: {reason}" | "visual-check を読み込めませんでした: {reason}" |
| `visual-check.success` | "visual-check {status}: {path}" | "visual-check {status}: {path}" |
| `visual-check.summary` | "containment {containment}; captures {captures}; visual review pending" | "containment {containment}、captures {captures}、visual review は保留中" |
