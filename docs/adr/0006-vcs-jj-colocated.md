# ADR-0006: VCS - Jujutsu (Colocated)

Date: 2026-05-28
Status: Accepted
Supersedes: ADR-0003

## Context

ADR-0003 では jj を non-colocated 運用と決めたが、本リポでの開発が進むに連れ以下のフリクションが顕在化した。

- `git remote -v` が空を返すため、`gh` を毎回 `--repo takagiyuuki/portfolio` 付きで呼ぶ必要があった
- lefthook(および Git hook を前提とする他ツール)は `.git/hooks/` にスクリプトを挿入する都合上、`.git/` が working copy 直下に存在しない non-colocated では機能しない
- エディタの Git 統合(VS Code / IntelliJ 等)が無効化される
- CI 連携で git ベースの assumption(`actions/checkout` の挙動など)とのズレが生まれやすい

## Decision

jj 0.40 で導入された `jj git colocation enable` コマンドで colocated 構成に移行する。`.jj/` と `.git/` が working copy 直下に共存する状態とする。

## Rationale

- 公式コマンドによる in-place 変換のため、リポを再 clone する必要がなく working change を失わない
- `jj git colocation disable` で完全に戻せるため試行リスクが低い
- ADR-0003 で挙げた non-colocated の優位(操作モデル統一、パフォーマンス)よりも、Git エコシステムとの統合性のメリットが大きいと判断
- 個人開発でチーム共有はないが、CI/CD や lefthook を導入する以上、Git working copy が必要

## Consequences

### Positive

- `gh` / lefthook / エディタ Git 拡張 / `git log` などが追加設定なしで動作
- jj 側の操作モデルは完全に保たれる(`jj new`, `jj describe`, `jj git push` 等は不変)
- `jj git colocation disable` で原状復帰可能

### Negative

- jj operation log と Git reflog が並存する。`git reset` / `git checkout` 等の ref を直接書き換える Git コマンドは jj の op log を経由しないため、混在使用時は注意
- Disk 上は Git の loose objects + jj snapshot を併存させるためわずかに増加

## Notes

`jj git colocation enable` は内部で `.jj/repo/store/git/` を `./.git/` に移動し、`.jj/repo/store/git_target` を新しいパスに更新する。手動でのファイル操作は不要。
