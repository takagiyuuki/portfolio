# ADR-0004: Tailwind v4 Integration - Vite Plugin

Date: 2026-04-27
Status: Accepted

## Context

Tailwind CSS v4 は設定ファイル方式を廃止し、CSS-first 設定（`@theme` ディレクティブ）に移行した。
Astro での統合方法として以下の選択肢が存在する:

1. `@astrojs/tailwind`（Astro 公式 integration）
2. `@tailwindcss/vite`（Tailwind 公式 Vite plugin）を `astro.config.ts` の vite.plugins に直接追加

## Decision

`@tailwindcss/vite` を vite.plugins 経由で統合する（選択肢 2）。

## Rationale

- `@astrojs/tailwind` は Tailwind v3 向けに設計されており、v4 対応は後付け。Tailwind 公式の推奨統合パスは Vite plugin
- `@theme {}` を含む CSS ファイルを `src/styles/global.css` に置き、BaseLayout から import する構成が最もシンプル
- `tailwind.config.js` / `tailwind.config.ts` を一切作らない（CSS-first 原則に従う）
- CLAUDE.md の「安易に依存を増やさない」原則にも合致（integration パッケージ追加なし）

## Consequences

### Positive

- 設定が CSS ファイル 1 つに集約され、JS 設定ファイルが不要
- `@theme` で定義したトークンが Tailwind ユーティリティとして自動的に使用可能
- Astro の Vite 統合と自然に共存

### Negative

- `@astrojs/tailwind` の便利な自動注入がないため、各 Layout から手動 import が必要
- Tailwind v4 のドキュメント・サンプルがまだ少なく、トラブル時の情報が限られる
