import { translateCliMessage } from '../renderers/shared/i18n.mjs';

const RAW_RECIPES = [
  {
    id: 'system-overview', type: 'architecture', proof: 'web-app',
    presentation: { preset: 'classic', motion: 'static', views: 'optional' },
    start: {
      ja: { descriptionPrompt: 'Use Archify to turn this plain-language system description into a high-level architecture diagram: [describe the users, core components, primary path, external dependencies, and boundaries]. No repository is required. Ask only for missing facts that would materially change the diagram, mark any remaining unknowns instead of inventing them, and keep one obvious primary path across 8–12 core components.' },
    },
    signals: [['システム全体', 12], ['全体像', 12], ['アーキテクチャ', 10], ['構成図', 10], ['コンポーネント', 6], ['サービス', 4], ['リポジトリ', 5], ['信頼境界', 8], ['構成', 5]],
    ja: {
      title: 'システム全体像', question: '何が存在し、誰が所有し、どう繋がっているか？',
      summary: '中核コンポーネント、外部依存、主要経路、信頼境界を、範囲を区切って地図にします。',
      useWhen: 'オンボーディング、設計レビュー、リポジトリの把握、サービス構成の説明。',
      avoidWhen: '正確な呼び出し順序、状態遷移、行レベルのデータリネージが必要な場合。',
      include: ['中核コンポーネント 8〜12個', '主要経路 1本', '外部依存', '信頼境界'],
      prompt: 'このリポジトリを分析し、Archify で高レベルのアーキテクチャ図を作成してください。実行時の中核コンポーネント 8〜12個、主要なリクエストまたはデータ経路 1本、外部依存、所有権や信頼の境界を示し、補足はエッジを増やさずカードに入れてください。',
    },
  },
  {
    id: 'deployment-ownership', type: 'architecture', proof: 'deployment-ownership',
    presentation: { preset: 'blueprint', motion: 'trace', views: 'recommended' },
    signals: [['デプロイ構成', 14], ['デプロイ', 8], ['リージョン', 7], ['vpc', 9], ['クラスタ', 6], ['アベイラビリティゾーン', 8], ['所有権', 7], ['インフラ', 8], ['本番環境', 7]],
    ja: {
      title: 'デプロイと所有権', question: '各ワークロードはどこで動き、何が境界をまたぐか？',
      summary: 'リージョン、ネットワーク、クラスタ、ワークロード、ストア、境界をまたぐ手段を、配置の観点で地図にします。',
      useWhen: 'クラウドレビュー、本番移行の準備、マルチリージョン計画、インフラ所有権の引き継ぎ。',
      avoidWhen: '配置の事実が未確定な場合、または本当の関心が配置ではなくアプリの挙動である場合。',
      include: ['リージョンとネットワーク', 'ワークロードの所有権', 'ステートフルなサービス', '境界をまたぐ手段の明示'],
      prompt: 'Archify で本番のデプロイ構成を描いてください。リージョン、ネットワーク、クラスタ、所有者でリソースをグループ化し、ワークロードとステートフルなサービスを示し、境界をまたぐ手段には全てラベルを付けてください。配置の事実を創作せず、不明な領域は明示してください。',
    },
  },
  {
    id: 'agent-tool-call', type: 'workflow', proof: 'agent-tool-call',
    presentation: { preset: 'signal-flow', motion: 'trace', views: 'recommended' },
    start: {
      ja: { descriptionPrompt: 'Use Archify workflow mode to turn this description into a diagram: [paste the actors, main steps, decisions, approvals, and exception paths]. Use lanes for distinct owners, keep one unmistakable happy path, and mark missing ownership or unresolved branches instead of inventing them.' },
    },
    signals: [['エージェント', 10], ['ツール呼び出し', 16], ['ツール実行', 12], ['承認ゲート', 10], ['人間の介在', 9], ['mcp', 7], ['プランナー', 6], ['エージェントループ', 10]],
    ja: {
      title: 'エージェントのツール呼び出しループ', question: 'エージェントはどう計画し、許可を得て、実行し、回復し、報告するか？',
      summary: 'ポリシーゲート、ツール実行、例外からの回復、証跡、最終応答を含むレーン構成のエージェントループです。',
      useWhen: 'エージェント実行環境、MCP やツール連携、承認、リトライ、可観測性の説明。',
      avoidWhen: '静的な構成要素だけを示したい場合、または API メッセージの正確なタイミングが目的の場合。',
      include: ['要求と計画', 'ポリシーまたは承認のゲート', 'ツール実行', '例外と証跡の経路'],
      prompt: 'Archify の workflow モードで、このエージェントのツール呼び出しループを説明してください。利用者接点、エージェント実行環境、ポリシー境界、例外処理、ツール実行、可観測性をレーンに分けてください。成功経路を主経路とし、承認・リトライ・ブロック・証跡の経路を明示してください。',
    },
  },
  {
    id: 'delivery-workflow', type: 'workflow', proof: 'delivery-workflow',
    presentation: { preset: 'classic', motion: 'trace', views: 'optional' },
    signals: [['ci/cd', 14], ['リリース', 14], ['デプロイパイプライン', 11], ['プルリクエスト', 7], ['ステージング', 7], ['ロールバック', 8], ['デリバリー', 10], ['本番反映', 9]],
    ja: {
      title: 'デリバリーワークフロー', question: '変更はコミットから本番まで、どう安全に進むか？',
      summary: 'ビルド、検査、環境、承認、スモークテスト、ロールバック、担当レーンを含むデリバリーの流れです。',
      useWhen: 'CI/CD 設計、リリースレビュー、デプロイのガバナンス、開発者へのデリバリー説明。',
      avoidWhen: 'インフラがどこで動くか、またはデプロイ対象がどの状態を取りうるかが問いである場合。',
      include: ['トリガーとビルド', 'ブロッキング検査', '承認と環境', 'ロールバックと検証'],
      prompt: 'Archify の workflow モードで、コミットから本番までのデリバリー工程を描いてください。開発者、CI、承認、環境、例外のレーンに分け、ブロッキング検査、スモークテスト、担当、ロールバック経路を明示してください。成功経路は一目で分かるようにしてください。',
    },
  },
  {
    id: 'incident-runbook', type: 'workflow', proof: 'incident-runbook',
    presentation: { preset: 'signal-flow', motion: 'trace', views: 'recommended' },
    signals: [['インシデント', 14], ['障害対応', 14], ['オンコール', 9], ['エスカレーション', 9], ['切り分け', 8], ['緩和', 7], ['手順書', 10], ['ランブック', 12]],
    ja: {
      title: 'インシデント対応手順', question: '対応者はどう検知し、切り分け、緩和し、検証し、エスカレーションするか？',
      summary: 'シグナル、対応者、緩和策、コミュニケーション、復旧の証跡を分離した運用ワークフローです。',
      useWhen: 'インシデント手順書、オンコール引き継ぎ、信頼性レビュー、机上演習。',
      avoidWhen: 'リアルタイムのメトリクスや、事後分析そのものが必要な場合。',
      include: ['検知シグナル', '切り分けと担当', '緩和と検証', 'エスカレーションと連絡'],
      prompt: 'Archify の workflow モードで、このインシデント対応手順を描いてください。検知シグナル、対応者、緩和策、コミュニケーション、復旧検証をレーンに分け、エスカレーション条件と復旧の判定基準を明示してください。',
    },
  },
  {
    id: 'api-request', type: 'sequence', proof: 'cache-miss',
    presentation: { preset: 'classic', motion: 'trace', views: 'optional' },
    start: {
      ja: { descriptionPrompt: 'Use Archify sequence mode to draw this interaction: [paste the participants, calls, returns, fallback, and asynchronous side effects]. Keep message order unambiguous, labels short, and unknown behavior explicit. No repository is required.' },
    },
    signals: [['api呼び出し', 14], ['呼び出し順序', 14], ['リクエスト', 8], ['シーケンス', 12], ['ライフサイクル', 8], ['認証', 6], ['キャッシュ', 6], ['時系列', 10], ['順序', 9]],
    ja: {
      title: 'API 呼び出し連鎖', question: '誰が誰を、どの順序で呼び、何が返るか？',
      summary: '認証、キャッシュのフォールバック、永続化、戻りの通信、非同期トレースを含む時系列のリクエスト経路です。',
      useWhen: 'API ドキュメント、レイテンシの調査、認証レビュー、キャッシュフォールバックの説明。',
      avoidWhen: '順序が重要でなく、どの構成要素が存在するかだけを伝えたい場合。',
      include: ['認証の位置', 'キャッシュとフォールバック', '永続化', '戻りと非同期トレース'],
      prompt: 'Archify の sequence モードで、この API リクエストの連鎖を描いてください。参加者ごとのライフラインを立て、認証・キャッシュ・永続化・戻りの順序を y 座標で示し、非同期のトレースは dashed で区別してください。',
    },
  },
  {
    id: 'async-roundtrip', type: 'sequence', proof: 'async-roundtrip',
    presentation: { preset: 'signal-flow', motion: 'trace', views: 'recommended' },
    signals: [['非同期', 14], ['webhook', 12], ['コールバック', 10], ['キュー', 8], ['ジョブ', 7], ['結果整合', 10], ['リトライ', 7], ['タイムアウト', 7]],
    ja: {
      title: '非同期の往復', question: '最初のリクエストが返った後、何が起きるか？',
      summary: '投入、受領応答、バックグラウンド処理、コールバック、リトライ、タイムアウト、最終的な整合までのシーケンスです。',
      useWhen: 'Webhook、ジョブ、キュー、決済コールバック、結果整合性、非同期 API の契約。',
      avoidWhen: '主たる問いがトピック構成やコンシューマの配置である場合。',
      include: ['投入と受領応答', 'バックグラウンド処理', 'コールバックとリトライ', 'タイムアウトと最終状態'],
      prompt: 'Archify の sequence モードで、この非同期の往復を描いてください。投入から受領応答までと、その後のバックグラウンド処理・コールバック・リトライ・タイムアウトを時系列で分け、最終的な整合がどこで成立するかを示してください。',
    },
  },
  {
    id: 'data-lineage', type: 'dataflow', proof: 'product-analytics',
    presentation: { preset: 'classic', motion: 'trace', views: 'recommended' },
    signals: [['データリネージ', 14], ['リネージ', 12], ['etl', 10], ['elt', 10], ['データパイプライン', 12], ['個人情報', 9], ['pii', 9], ['ウェアハウス', 8], ['データ変換', 9]],
    ja: {
      title: 'データリネージ', question: 'データはどこから来て、どう変換され、誰が使うか？',
      summary: 'ソースから同意管理、変換、機微データストア、ウェアハウス、利用者までを統制の観点で辿る経路です。',
      useWhen: '分析基盤の設計、ETL/ELT レビュー、個人情報の評価、ウェアハウス設計、特徴量のリネージ。',
      avoidWhen: 'リクエストのタイミングや状態遷移が必要な場合。',
      include: ['データソース', '変換と同意', '機微データの扱い', '利用者'],
      prompt: 'Archify の dataflow モードで、このデータの流れを描いてください。ソース、変換、蓄積、利用者をステージに分け、個人情報や同意が関わる箇所は classification で明示してください。',
    },
  },
  {
    id: 'event-stream', type: 'dataflow', proof: 'event-stream',
    presentation: { preset: 'signal-flow', motion: 'trace', views: 'recommended' },
    start: {
      ja: { descriptionPrompt: 'Use Archify dataflow mode to map this data journey: [paste the sources, data assets, transforms, stores, boundaries, and consumers]. Label every flow, distinguish streaming from batch where relevant, and mark unknown classifications or ownership instead of inventing them.' },
    },
    signals: [['イベントストリーム', 14], ['kafka', 12], ['トピック', 9], ['ストリーム処理', 11], ['コンシューマ', 8], ['dlq', 10], ['再処理', 8], ['イベント基盤', 11]],
    ja: {
      title: 'イベントストリーム構成', question: 'どのイベントが、どのトピック・処理・グループ・失敗経路を通るか？',
      summary: 'プロデューサ、トピック、順序保証のある処理、コンシューマグループ、状態、再処理、DLQ のストリーム地図です。',
      useWhen: 'Kafka やイベント基盤の設計、ストリーム処理のレビュー、所有権、再処理、失敗時の扱い。',
      avoidWhen: 'トピック名やコンシューマグループが未確定な場合。',
      include: ['プロデューサとトピック', '順序保証のある処理', 'コンシューマグループ', '再処理と DLQ'],
      prompt: 'Archify の dataflow モードで、このイベントストリーム構成を描いてください。プロデューサ、トピック、処理、コンシューマグループをステージに分け、再処理経路と DLQ を明示してください。',
    },
  },
  {
    id: 'object-lifecycle', type: 'lifecycle', proof: 'agent-run',
    presentation: { preset: 'classic', motion: 'trace', views: 'optional' },
    start: {
      ja: { descriptionPrompt: 'Use Archify lifecycle mode to model this object: [paste its states, transition events, waits, retries, cancellation, and terminal outcomes]. Separate active, waiting, recoverable-failure, and terminal states, and never hide an ending. No repository is required.' },
    },
    signals: [['ライフサイクル', 14], ['状態遷移', 14], ['ステートマシン', 13], ['状態', 8], ['ステータス', 8], ['リトライ', 6], ['キャンセル', 7], ['終端', 7]],
    ja: {
      title: 'オブジェクトのライフサイクル', question: 'どの状態が存在し、何が状態を動かし、どう終わるか？',
      summary: '実行中の作業、待ち、リトライ、キャンセル、失敗、明示的な終端状態を含む状態モデルです。',
      useWhen: 'タスク、注文、チケット、サブスクリプション、ジョブ、エージェント実行など、状態を持つ永続オブジェクト。',
      avoidWhen: '対象が永続的な状態を持たず、単発の処理である場合。',
      include: ['開始状態', '実行中と待ち', 'リトライとキャンセル', '終端状態'],
      prompt: 'Archify の lifecycle モードで、このオブジェクトの状態遷移を描いてください。開始、実行中、待ち、リトライ、キャンセル、失敗、終端を状態として並べ、遷移を起こすイベントをラベルにしてください。',
    },
  },
  {
    id: 'deployment-lifecycle', type: 'lifecycle', proof: 'deployment-lifecycle',
    presentation: { preset: 'signal-flow', motion: 'trace', views: 'recommended' },
    signals: [['デプロイ状態', 14], ['リリース状態', 14], ['gitops', 11], ['昇格', 8], ['ロールバック', 8], ['リリースコントローラ', 12]],
    ja: {
      title: 'デプロイのライフサイクル', question: 'リリースは今どの状態にあり、次に何が起こりうるか？',
      summary: '待機、ビルド、検証、承認、昇格、ロールバック、終端状態を扱うデプロイの状態モデルです。',
      useWhen: 'リリースコントローラ、GitOps の収束、環境の昇格、デプロイ状態 API。',
      avoidWhen: '問いが人や CI の作業手順そのものである場合。',
      include: ['待機とビルド', '検証と承認', '昇格とロールバック', '終端状態'],
      prompt: 'Archify の lifecycle モードで、リリースの状態遷移を描いてください。待機、ビルド、検証、承認、昇格、ロールバック、終端を状態として並べ、各遷移の条件をラベルにしてください。',
    },
  },
];

export const SCENARIO_RECIPES = Object.freeze(RAW_RECIPES.map((recipe) => Object.freeze({
  ...recipe,
  presentation: Object.freeze({ ...recipe.presentation }),
  ...(recipe.start ? { start: Object.freeze({
    ja: Object.freeze({ ...recipe.start.ja }),
  }) } : {}),
  signals: Object.freeze(recipe.signals.map((signal) => Object.freeze(signal.slice()))),
  ja: Object.freeze({ ...recipe.ja, include: Object.freeze(recipe.ja.include.slice()) }),
})));

export function detectGuideLanguage(value = '') {
  return 'ja';
}

export function startPromptsFor(recipe, lang = 'ja') {
  const language = 'ja';
  const copy = recipe.ja;
  const descriptionPrompt = recipe.start?.ja?.descriptionPrompt;
  if (!descriptionPrompt) {
    throw new Error(`Scenario recipe ${JSON.stringify(recipe.id)} does not define a ${language} start prompt.`);
  }
  const repositoryPrompt = recipe.type === 'architecture'
    ? copy.prompt
    : `このリポジトリを調査して根拠を集めたうえで、${copy.prompt} コードが裏付けない挙動を創作しないでください。`;
  return { descriptionPrompt, repositoryPrompt };
}

function normalized(value) {
  return String(value || '').normalize('NFKC').toLowerCase().replace(/[\s_]+/g, ' ').trim();
}

function localized(recipe, lang) {
  const copy = recipe.ja;
  return {
    id: recipe.id,
    type: recipe.type,
    proof: recipe.proof,
    presentation: { ...recipe.presentation },
    ...copy,
    include: copy.include.slice(),
  };
}

export function listScenarioRecipes(lang = 'ja') {
  return SCENARIO_RECIPES.map((recipe) => localized(recipe, lang));
}

function scoreRecipe(recipe, query) {
  const text = normalized(query);
  if (!text) return { recipe, score: 0, matched: [] };
  if (text === recipe.id || text === recipe.id.replace(/-/g, ' ')) {
    return { recipe, score: 100, matched: [recipe.id] };
  }
  let score = 0;
  const matched = [];
  for (const [signal, weight] of recipe.signals) {
    if (text.includes(normalized(signal))) {
      score += weight;
      matched.push(signal);
    }
  }
  return { recipe, score, matched };
}

export function recommendScenario(query, options = {}) {
  const lang = 'ja';
  const ranked = SCENARIO_RECIPES.map((recipe) => scoreRecipe(recipe, query))
    .sort((left, right) => right.score - left.score || SCENARIO_RECIPES.indexOf(left.recipe) - SCENARIO_RECIPES.indexOf(right.recipe));
  const winner = ranked[0].score > 0 ? ranked[0] : { recipe: SCENARIO_RECIPES[0], score: 0, matched: [] };
  const confidence = winner.score >= 14 ? 'high' : winner.score >= 7 ? 'medium' : 'low';
  return {
    ok: true,
    mode: 'recommendation',
    lang,
    query: String(query || ''),
    confidence,
    matchedSignals: winner.matched.slice(),
    recommendation: localized(winner.recipe, lang),
    alternatives: ranked.filter((entry) => entry.recipe.id !== winner.recipe.id && entry.score > 0)
      .slice(0, 2)
      .map((entry) => ({ ...localized(entry.recipe, lang), score: entry.score })),
  };
}

export function formatScenarioList(lang = 'ja') {
  const heading = translateCliMessage('guide.list.heading', { count: SCENARIO_RECIPES.length });
  const intro = translateCliMessage('guide.list.intro');
  return [heading, '', intro, '', ...listScenarioRecipes(lang).flatMap((recipe) => [
    `${recipe.id}  [${recipe.type}]  ${recipe.title}`,
    `  ${recipe.question}`,
  ])].join('\n');
}

export function formatScenarioRecommendation(result) {
  const recipe = result.recommendation;
  const labels = {
    heading: translateCliMessage('guide.label.recommendation'),
    question: translateCliMessage('guide.label.question'),
    use: translateCliMessage('guide.label.use'),
    avoid: translateCliMessage('guide.label.avoid'),
    include: translateCliMessage('guide.label.include'),
    presentation: translateCliMessage('guide.label.presentation'),
    prompt: translateCliMessage('guide.label.prompt'),
    alternatives: translateCliMessage('guide.label.alternatives'),
    confidence: translateCliMessage('guide.label.confidence'),
  };
  const lines = [
    `${labels.heading}: ${recipe.title}  [${recipe.type}]`,
    `${labels.confidence}: ${translateCliMessage(`guide.confidence.${result.confidence}`)}`,
    `${labels.question}: ${recipe.question}`,
    '',
    `${labels.use}: ${recipe.useWhen}`,
    `${labels.avoid}: ${recipe.avoidWhen}`,
    `${labels.include}: ${recipe.include.join('; ')}`,
    `${labels.presentation}: ${recipe.presentation.preset} · ${recipe.presentation.motion} · views ${recipe.presentation.views}`,
    '',
    `${labels.prompt}:`,
    recipe.prompt,
  ];
  if (result.alternatives.length) {
    lines.push('', `${labels.alternatives}: ${result.alternatives.map((item) => `${item.title} [${item.type}]`).join(' · ')}`);
  }
  return lines.join('\n');
}

export function publicGuideData() {
  return SCENARIO_RECIPES.map((recipe) => ({
    ...localized(recipe, 'ja'),
    ja: recipe.ja,
    signals: recipe.signals.map(([signal, weight]) => [signal, weight]),
  }));
}
