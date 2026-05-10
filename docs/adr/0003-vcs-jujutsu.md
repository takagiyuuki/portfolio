# ADR-0003: VCS - Jujutsu (Non-Colocated)

Date: 2026-04-26
Status: Superseded by ADR-0006 (2026-05-28)

## Context

個人開発の VCS として jj (Jujutsu) を使用。Git バックエンドの設定として
colocated か non-colocated かを選択する必要がある。

## Decision

non-colocated（Pure jj）で運用する。

## Rationale

- dotfiles リポジトリで non-colocated 運用の実績あり
- jj 公式ドキュメントが colocated の disadvantages として、jj/git コマンド混在による
  branch conflict や divergent change id の発生、ref 多数時のパフォーマンス劣化を明示
- non-colocated は jj 一本で完結し、操作の一貫性が高い
- GitHub 連携は `jj git push/fetch` で問題なく動作

## Consequences

### Positive

- 操作モデルが統一され、混乱が起きない
- パフォーマンス影響なし
- jj の機能をフル活用

### Negative

- VS Code の git 拡張は使えない、jj 専用拡張または CLI で代替
- チーム開発時、Git のみのメンバーが触れる場合は colocated への切替が必要かも
