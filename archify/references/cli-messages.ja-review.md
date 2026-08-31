# CLI メッセージ英日レビュー表

英語 CLI source を正本として、human-facing usage、diagnostic、error、supportedFixes を直接日本語化した対照表です。command、option、path、数値、JSON field、diagnostic code は翻訳対象に含めません。各セルは補間変数と空白を厳密に比較できるよう JSON 文字列で記載しています。

| key | English | Japanese |
| --- | --- | --- |
| `usage.heading` | "Usage:" | "使い方:" |
| `usage.architecture-only` | "architecture only" | "architecture のみ" |
| `usage.guide-argument` | "scenario or question" | "シナリオまたは質問" |
| `usage.brands-query` | "name, alias, domain, or category" | "名前、別名、ドメイン、またはカテゴリ" |
| `usage.output-directory` | "output-directory" | "出力ディレクトリ" |
| `usage.types` | "Types:" | "種類:" |
| `error.unknown-command` | "Unknown command \"{command}\"." | "不明なコマンド \"{command}\"。" |
| `error.unknown-option` | "Unknown {command} option \"{option}\"." | "不明な {command} オプション \"{option}\"。" |
| `diagnostic.fix-label` | "Fix:" | "修正:" |
| `input.json-parse.message` | "Input JSON could not be parsed: {reason}" | "入力 JSON を解析できませんでした: {reason}" |
| `input.json-parse.fix` | "repair the JSON syntax and run validation again" | "JSON の構文を修正してから、もう一度検証してください" |
| `input.read.message` | "Input could not be read: {reason}" | "入力を読み込めませんでした: {reason}" |
| `input.read.fix` | "provide one readable JSON input file" | "読み取り可能な JSON 入力ファイルを 1 つ指定してください" |
| `doctor.heading` | "Archify doctor" | "Archify 診断" |
| `doctor.node` | "Node.js v{version} (requires >=18)" | "Node.js v{version}（18 以上が必要）" |
| `doctor.core-template` | "Core template" | "コアテンプレート" |
| `doctor.example-renderer` | "Example renderer" | "サンプルレンダラー" |
| `doctor.preview-runtime` | "Live preview runtime" | "ライブプレビュー実行環境" |
| `doctor.visual-check-runtime` | "Visual-check runtime" | "visual-check 実行環境" |
| `doctor.output-path-runtime` | "Output path safety runtime" | "出力パス安全性の実行環境" |
| `doctor.scenario-guide` | "Scenario recipe guide" | "シナリオレシピガイド" |
| `doctor.authoring-references` | "Progressive authoring references" | "段階的な作成ガイド" |
| `doctor.compare-runtime` | "Architecture compare runtime and proof fixtures" | "アーキテクチャ比較の実行環境と証跡用データ" |
| `doctor.validators` | "Standalone schema validators" | "スタンドアロンのスキーマ検証器" |
| `doctor.renderer-bundle` | "{type} renderer, schema, and example" | "{type} のレンダラー、スキーマ、サンプル" |
| `doctor.ready` | "Archify is ready." | "Archify を使用できます。" |
| `doctor.not-ready` | "Archify is not ready: {problems}." | "Archify を使用できません: {problems}。" |
| `doctor.node-required` | "Node.js 18 or newer is required" | "Node.js 18 以上が必要です" |
| `doctor.files-missing` | "{count} required file(s) missing" | "必要なファイルが {count} 件ありません" |
| `doctor.runtime-failed` | "{count} runtime check(s) failed" | "実行時検査が {count} 件失敗しました" |
| `schema.validation-failed` | "{type} schema validation failed:" | "{type} のスキーマ検証に失敗しました:" |
| `schema.additional-properties.message` | "{path} must NOT have additional properties {details}" | "{path} に未対応のプロパティを含めることはできません {details}" |
| `schema.additional-properties.fix` | "remove unsupported property {property}" | "未対応のプロパティ {property} を削除してください" |
| `schema.required.message` | "{path} must have required property {property} {details}" | "{path} に必須プロパティ {property} がありません {details}" |
| `schema.required.fix` | "add required property {property}" | "必須プロパティ {property} を追加してください" |
| `schema.type.message` | "{path} must be {type} {details}" | "{path} の型は {type} でなければなりません {details}" |
| `schema.type.fix` | "use {type} at {path}" | "{path} には {type} を使用してください" |
| `schema.enum.message` | "{path} must be equal to one of the allowed values {details}" | "{path} は許可された値のいずれかでなければなりません {details}" |
| `schema.enum.fix` | "choose one of {values}" | "{values} のいずれかを選択してください" |
| `schema.pattern.message` | "{path} must match pattern {pattern} {details}" | "{path} はパターン {pattern} に一致しなければなりません {details}" |
| `schema.pattern.fix` | "match the required pattern {pattern}" | "必須パターン {pattern} に一致させてください" |
| `schema.minimum.message` | "{path} must be {comparison} {limit} {details}" | "{path} は {comparison} {limit} でなければなりません {details}" |
| `schema.minimum.fix` | "use a value {comparison} {limit}" | "{comparison} {limit} の値を使用してください" |
| `schema.maximum.message` | "{path} must be {comparison} {limit} {details}" | "{path} は {comparison} {limit} でなければなりません {details}" |
| `schema.maximum.fix` | "use a value {comparison} {limit}" | "{comparison} {limit} の値を使用してください" |
| `schema.min-items.message` | "{path} must NOT have fewer than {limit} items {details}" | "{path} には {limit} 項目以上が必要です {details}" |
| `schema.min-items.fix` | "provide at least {limit} item(s)" | "{limit} 項目以上を指定してください" |
| `schema.max-items.message` | "{path} must NOT have more than {limit} items {details}" | "{path} は {limit} 項目以下でなければなりません {details}" |
| `schema.max-items.fix` | "provide at most {limit} item(s)" | "{limit} 項目以下を指定してください" |
| `schema.min-length.message` | "{path} must NOT have fewer than {limit} characters {details}" | "{path} は {limit} 文字以上でなければなりません {details}" |
| `schema.min-length.fix` | "provide at least {limit} character(s)" | "{limit} 文字以上を指定してください" |
| `schema.max-length.message` | "{path} must NOT have more than {limit} characters {details}" | "{path} は {limit} 文字以下でなければなりません {details}" |
| `schema.max-length.fix` | "provide at most {limit} character(s)" | "{limit} 文字以下を指定してください" |
| `relationship.validation-failed` | "Relationship identity validation failed" | "関係 ID の検証に失敗しました" |
| `relationship.duplicate-id` | "{path} duplicates relationship id {id}" | "{path} で関係 ID {id} が重複しています" |
| `guided-view.validation-failed` | "Guided view validation failed" | "ガイド表示の検証に失敗しました" |
| `guided-view.duplicate-view-id` | "{path} duplicates view id {id}" | "{path} で表示 ID {id} が重複しています" |
| `guided-view.duplicate-semantic-id` | "{path} duplicates semantic id {id}" | "{path} でセマンティック ID {id} が重複しています" |
| `guided-view.unknown-semantic-id` | "{path} references unknown semantic id {id}" | "{path} が不明なセマンティック ID {id} を参照しています" |
| `i18n.invalid-message` | "Invalid Archify i18n message {key} for {locale}" | "Archify の i18n メッセージ {key} は {locale} で無効です" |
| `i18n.missing-message` | "Missing Archify i18n message {key} for {locale}" | "Archify の i18n メッセージ {key} が {locale} にありません" |
