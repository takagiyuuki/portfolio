# ADR-0015: CSS-first — ユーティリティと `@theme` を使わない

Date: 2026-08-28
Status: Accepted
Amends: ADR-0004

## Context

ADR-0004 で Tailwind v4 を `@tailwindcss/vite` 経由で統合し、`@theme` にトークンを置く構成を採用した。
その前提は「`@theme` のトークンがユーティリティとして使われる」ことだったが、実装が進んだ時点で
実態は異なっていた。

- `@theme inline` が生成する `--color-background` / `--color-foreground` / `--color-link` /
  `--color-border` は、ユーティリティからも CSS からも参照ゼロだった
- リポジトリ内のユーティリティ使用は `index.astro` の h1 に付いた 3 クラスのみ
- レイアウトは BaseLayout の scoped CSS で組まれており、ユーティリティを前提としていない
- Preflight が素の h1 / p / ul を潰すため、ユーティリティを使わない箇所は見た目が崩れていた

さらに `@theme` 単体ではダークモードを表現できず（`@media` 内に `@theme` は書けない）、
`:root` と `@theme inline` にトークンが二重定義される構造になっていた。

## Decision

- スタイルは **CSS-first** で書く。デザイントークンは `src/styles/global.css` の `:root` に集約し、
  素の要素スタイルは `@layer base` に置く。コンポーネント固有のスタイルは Astro の scoped CSS。
- **ユーティリティクラスは使わない。**
- **`@theme` / `@theme inline` は使わない。** トークン名は Tailwind の名前空間を避け、
  セマンティックな名前（`--font-body` / `--text-body` / `--leading-body` / `--text-h1..h3`）にする。
- ADR-0004 の Decision（`@tailwindcss/vite` を使う / `tailwind.config.*` を作らない）は維持する。

## Rationale

- 参照ゼロのトークンを生成する `@theme` を残す理由がない。二重定義の保守コストだけが残る。
- トークンを `:root` の 1 箇所に集約すると、ダークモードの上書きと同じ仕組みに乗る。
- Tailwind の名前空間（`--font-sans` / `--text-base`）を自前で `:root` に定義すると
  Tailwind 自身の定義と同名になり、どちらが効いているか読めなくなる。
- ユーティリティを使わないなら、素の要素が正しく表示されることの方が重要度が高い。

## Consequences

### Positive

- スタイルの記述場所が「グローバル要素スタイル = `@layer base`」「固有 = scoped CSS」の 2 つに絞られる。
- Tailwind への依存が `@import 'tailwindcss'` の 1 行に閉じ、責務は Preflight とレイヤー順宣言のみになった。
  撤去可否（#82）が `global.css` / `astro.config.ts` / `package.json` の 3 ファイルの問題に縮小した。

### Negative

- ユーティリティの記述速度は捨てる。新しいスタイルは毎回 CSS を書く。
- `@layer base` の要素スタイルは Preflight より後に置かれる前提に依存する。この順序は
  `@import 'tailwindcss'` が出力する `@layer` 宣言が担保しており、Tailwind を外す際は
  `@layer reset, base;` を自前で宣言する必要がある。
- Preflight を使い続ける限り、ユーティリティを 1 つも使わなくても Tailwind の依存は残る。
  最終判断は #82 に委ねる。

## References

- #5 / PR #90（実装）
- #9（トークン集約。`@theme` ではなく `:root` に集約した経緯）
- #82（Tailwind の完全撤去可否。Phase 2 完了時に再評価）
