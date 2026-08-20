# ADR-0012: ブログ記事は外部リポ / Zenn で管理し、/writing は index のみ

## Status

Accepted (2026-05-28)

## Context

ブログ記事の配置先として、以下の 2 案があった:

1. 本リポの `src/content/writing/` MDX collection に記事本体を置く
2. 記事本体は別リポ + 外部プラットフォームに置き、本サイトはリンク集に徹する

## Decision

- 記事本体は別リポ `takagiyuuki/blog`（Zenn CLI 管理）に置き、Zenn へ公開する（案 2）
- 本リポの `/writing` は **外部 Zenn 記事の index のみ**とする
  （タイトル・公開日・ジャンル・Zenn へのリンクを一覧表示。Zenn feed への RSS リンクは任意）

## Rationale

- Zenn を技術記事の主要プラットフォームとして使い、読者リーチを取るため
- ポートフォリオサイトはコンテンツのホストではなく discovery surface と位置づける

## Consequences

- 本リポに `src/content/writing/` MDX collection は **作らない**
- index の生成方式（Zenn RSS を build 時 parse / 手動 TS リスト / Zenn user API）は別途決定する
- 「本サイトの運用そのものを書く ops docs」の置き場は本 ADR の対象外
  （Zenn か、本リポ MDX co-located か未定。着手時にユーザーへ確認する）
