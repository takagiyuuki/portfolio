# ADR-0014: アクティビティ Timeline を優先し、ブログ一覧(/writing)を保留

## Status

Accepted (2026-08-26)

## Context

ADR-0012 で `/writing` は外部 Zenn 記事の index（一覧のみ）と決定済み。しかし現時点で Zenn 記事は 1 本しかなく、一覧ページの価値が薄い。

一方、エンジニアのポートフォリオでは GitHub / Zenn 等の活動を時系列表示する「アクティビティ Timeline」が定番で、訴求力が高い。

## Decision

- ブログ一覧ページ (`/writing`) の実装は Zenn 記事数が増えるまで **保留** する（ADR-0012 の決定自体は維持）。
- 代わりに **アクティビティ Timeline を優先実装** する。
- 表示ソースと取得方式は別途決定する（下記を初期候補とする）。

## Rationale

- 記事 1 本の一覧より、複数ソースの活動を束ねた Timeline の方が現時点の情報量・訴求力が高い。
- SRE/Platform 志望のアピールとして、GitHub の活動や自身のデプロイ/リリース等を時系列で見せる価値がある。

## 初期方針（暫定）

- ソース: GitHub + Zenn を核とする。X(旧Twitter)は API 有料化のため v1 では見送り。
- 取得: build-time 取得 + 日次 cron リビルド（既存の reusable deploy workflow を cron caller から再利用）。SSG のまま鮮度を担保し、動的バックエンド不要（Non-Goals）を維持する。
- 異種ソースを正規化したイベントモデル（`date` / `type` / `title` / `url` / `source`）で build 時にマージ&ソート。非公式 API 障害時もビルド継続するフォールバックを設計する。

## Consequences

- nav の `Writing` は当面 404 になるため、非表示化 or プレースホルダを検討する。
- Timeline のソース確定・取得実装・cron リビルドの構築が新たなタスクになる。
- 手動/静的エントリ（登壇・資格・マイルストーン等、フィードの無い実績）を自動フェッチとマージするパターンを検討する。
