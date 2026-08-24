# ADR-0013: VCS - Git-only（jj colocated からの一時移行）

Date: 2026-08-24
Status: Accepted
Supersedes: ADR-0006

## Context

ADR-0006 では jj colocated 運用を採用した。運用を続ける中で以下が顕在化した。

- Starship（zsh のカスタムプロンプト）が working copy 直下の `.jj/` を検出し、
  Git ではなく jj のリポ状態を表示するため、Git 側の状態把握の妨げになる
- jj を使うと Git の内部モデル（index / ref / reflog / rebase など）を
  自分で操作する機会を回避してしまい、Git ワークフローの学習が進まない

本リポは学習を兼ねており、現在は Git の基礎ワークフローを習得することを優先する。

## Decision

jj を運用から外し、**Git 単独運用**へ移行する。

- commit / push / branch / rebase などすべての VCS 操作を Git で行う
- working copy 直下の `.jj/` を削除する（`.jj/` は git 管理外のため git に影響しない）
- GitHub 連携は `git push` / `git fetch` / `gh` を使う

## Rationale

- 学習目的: Git の内部構造とワークフローを実地で習得するため（本移行の第一目的）
- Starship の jj 情報混在を解消し、プロンプト表示を Git に一本化する
- lefthook / `gh` / エディタの Git 統合は元々 Git working copy 前提であり、
  jj を外しても運用への影響はない

## Consequences

### Positive

- Git 標準ツール・エディタ Git 統合・Starship 表示がすべて Git 基準で素直に動く
- Git の実地学習が進む

### Negative

- jj の operation log / `jj undo` / 強力な履歴編集などの利点を失う
- `.jj/` 削除により jj 側の履歴・working copy 状態は失われる（非可逆）

## Notes

- `.jj/` は `.jj/.gitignore`（内容 `/*`）により git 管理外。削除は `rm -rf .jj` で行い、
  git のトラッキングやリモートには一切影響しない
- 本 ADR は学習フェーズの決定であり、恒久決定ではない。
  Git の基本ワークフローを十分習得したのち、jj colocated への再移行を将来的に検討する
