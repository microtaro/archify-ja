# 組み込みBrand mark

Archifyはarchitecture、workflow、sequence、data-flow、lifecycleのnode向けに、よく使われるbrand 107件の限定catalogueを同梱します。markは任意のオーサリング済みidentityです。nodeのsemantic `type`、color、label、relationshipを置き換えることはありません。

未知のsiteは、明示的な2段階workflowで扱います。`node bin/archify.mjs brands capture <url> --json` を実行し、返されたdigest固定済み `brand` 値をオーサリングします。通常のrenderおよびvalidate commandでは固定されていないcaptureを実行せず、変更済みまたは利用不能なcontentはfail closedします。

ほとんどのvector pathとbrand metadataはSimple Icons 16.28.0から生成されています。OpenAI markの出典はOpenAI公式brand guidelineです。生成された各entryは、そのsourceと、upstreamで利用できる場合はguidelineおよびlicense metadataを `renderers/shared/generated-brand-marks.mjs` に記録します。

brand名とlogoは、それぞれのownerのtrademarkである場合があります。Simple IconsのCC0 licenseが対象とするのはcollection作業であり、基礎となるすべてのtrademarkやartworkではありません。contributorはmarkを追加または更新する前に、記録されたsource、現在のbrand guideline、意図する参照用途を確認しなければなりません。Archifyはsponsorship、endorsement、partnershipを示唆しません。

`catalog.json` を編集してから、commit対象のzero-runtime-dependency bundleを再生成します。

```bash
npm run generate:brand-marks
npm run check:brand-marks
```

`renderers/shared/generated-brand-marks.mjs` を手作業で編集してはなりません。
