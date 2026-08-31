# Brand mark（ブランドマーク）

実在するproduct、provider、model family、channel、serviceのidentityがreaderの理解に役立つ場合にだけ、brand markを使います。semantic `type` は引き続きnodeの役割を説明し、`brand` はどの会社のproductかを説明します。

## Agentの判断手順

1. 依頼に認識可能なbrand名がある場合は、組み込みcatalogueを検索します。

   ```bash
   node bin/archify.mjs brands "Claude" --json
   ```

2. 返されたcanonical IDをnode、participant、stateに入れます。

   ```json
   {
     "id": "planner",
     "type": "backend",
     "label": "Claude",
     "brand": "claude"
   }
   ```

3. catalogueに一致せず、ユーザーが公式websiteを提供した場合は、そのiconを明示的にcaptureします。

   ```bash
   node bin/archify.mjs brands capture "https://partner.example.com" --json
   ```

   commandが返したdigest固定済み `brand` 値を、オーサリング対象nodeに入れます。

   ```json
   {
     "id": "partner",
     "type": "external",
     "label": "Partner portal",
     "brand": {
       "url": "https://partner.example.com",
       "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
     }
   }
   ```

4. 一致するbrandがなく、ユーザー提供URLもない場合は `brand` を省略します。URLを創作したり、見た目が似た会社を黙って割り当てたりしてはなりません。

既知brandのURLはnetworkを使わず、同梱vectorへ解決されます。未知URLのcaptureは、上限付きのraster image formatだけを受け付け、credential、非標準public port、privateまたはlink-local destinationをblockします。上限付きconcurrencyと全体deadlineを1つ使い、captureしたcontent digestを返します。その後のrenderとvalidateでは、その正確なdigestが必要です。block済み、利用不能、変更済み、oversize、またはunsafeなcontentは、成果物を黙って変更するのではなくfail closedします。

最終成果物を開いた際にbrand assetを取得することはありません。preset vectorとdigest検証済みのcapture済みsite iconは、SVG、PNG、WebP、JPEG、Share Card、WebM export内に埋め込まれたままです。

すべてのcanonical ID、alias、category、domain、provenanceを調べるには、`node bin/archify.mjs brands --json` を使います。現在のcategoryはAI、cloud、engineering、data、collaboration、business system、channel、language、frameworkを扱います。
