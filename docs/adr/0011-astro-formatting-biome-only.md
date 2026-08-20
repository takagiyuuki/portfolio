# ADR-0011: .astro フォーマッタを Biome に統一（Prettier 不採用）

## Status

Accepted (2026-05-28)

## Context

`.astro` ファイルの linter / formatter の扱いに、以下の 2 案があった:

1. `.astro` を含め Biome 2.x に統一する（Astro template 部分は experimental）
2. `.astro` のみ Prettier + prettier-plugin-astro を使い、他ファイルは別 linter に分ける

Astro LSP は `Couldn't load prettier or prettier-plugin-astro` 警告を出すため、
どちらの方針でもエディタ側の整合を取る必要がある。

## Decision

`.astro` を含め **Biome に統一**する（案 1）。Prettier + prettier-plugin-astro は導入しない。
Astro template 部分が Biome 2.x で experimental であることは許容する。

## Rationale

- CLAUDE.md「ESLint・Prettier・Husky を導入しない」原則に合致する
- 2 つのフォーマッタが境界条件で衝突するメンテコストの方が、experimental の整形揺れより重いと判断
- SRE/Platform Engineer 志望のポートフォリオとして「設定統一・運用負債の最小化」を設計判断で示す狙い

## Consequences

- Astro template の整形は Biome 2.x の experimental 挙動に依存する
- experimental の不便が **具体的に顕在化した時点で** 再評価する（それまでは本決定を尊重）
- biome.json の Astro override は既設のため追加設定は不要
- エディタ（nvim / conform / LSP formatting capability）側の設定は machine-specific のため
  dotfiles で管理し、本 ADR の範囲外とする
