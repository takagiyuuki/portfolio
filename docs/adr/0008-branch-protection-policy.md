# ADR-0008: Branch Protection Policy — Required Approvals for Solo + AI Workflow

Date: 2026-06-08
Status: Accepted

## Context

このリポジトリは個人開発で、将来的にチーム化する予定はない。
`main` へ PR を出すケースは以下のいずれか。

1. 開発者本人(yuki)が手動で PR を出す
2. AI agent(Claude Code 等)が代行で PR を出す

`protect-main` ruleset(`docs/ops/github-repo-security.md` 初版で設定)では `Require pull request: ✅, Required approvals: 1` を採用していたが、Phase 0 完了時の初回 PR で以下が判明した。

- **ケース 1 では self-approve が不可能**: GitHub は PR の author が自分の PR を approve することを構造的に許可しない。1 人運用で他に approver が存在しないため、PR が `REVIEW_REQUIRED` から永久に進まない
- **`gh pr merge --admin` も拒否**: ruleset の bypass actors に admin role が含まれていないと、admin 権限でも `Repository rule violations found` で失敗する
- **GUI で ruleset を一時 disable → merge → 再有効化**しないと先に進めなかった

このフリクションは PR を出すたびに発生するため、運用ルール自体の見直しが必要となった。

## Decision

`protect-main` ruleset の `Required approvals` を **1 → 0** に変更する。

`Require pull request` 自体は **ON のまま**維持する(`main` への直 push は引き続き禁止)。
他のガード(force push 禁止、deletion 禁止、将来の CI checks 必須)も維持する。

## Rationale

- **PR 経由ワークフローは強制される**: `main` への直 push は禁止のまま。commit history が綺麗に保たれ、PR description が change log として機能する
- **approval 不要なので self-merge が可能**: ケース 1 で詰まらない
- **AI 代行のケース 2 では人間が approve する運用が自然**: PR creator ≠ approver なので、approval 要件があってもなくても運用上の挙動は同じ(approve するか否かは自主性に委ねる)
- **admin role の特権を増やさない**: 後述の案 B(admin role を bypass list に追加)はすべての rule を bypass 可能になるため、ガードが過度に弱まる
- **将来チーム化する場合の戻し方は 1 操作**: `Required approvals: 0 → 1` を変えるだけ

## Consequences

### Positive

- self-merge の詰まりが解消され、Phase 0 以降の運用フローがスムーズになる
- PR 経由フローは維持されるため、commit history と PR description で運用記録が残る
- admin の特権を増やさず、不慮の rule bypass を防げる
- AI 代行 PR を人間が approve するワークフローは引き続き機能する

### Negative

- approval なしで merge できるため、self-discipline に依存する(他者のレビューに頼れない)
- 将来チーム化する際に approval 要件を戻し忘れるリスクがある

### Mitigation

- 本リポは個人開発前提のため、self-discipline で許容範囲
- 重要な変更は PR description にチェックリストを書いて self-review する習慣を維持する
- AI 代行 PR は人間が approve する運用を維持
- チーム化する場合は本 ADR を supersede する新 ADR を起こし、`Required approvals` を 1 以上に戻す

## Alternatives Considered

| 案 | 内容 | 不採用理由 |
|---|---|---|
| A | ruleset を一時 disable → merge → 再有効化 | 毎回手動操作が必要、自動化困難、運用負荷が高い |
| B | bypass actors に "Repository admin" role を追加 | admin がすべての rule を bypass 可能になり、ガードが過度に弱まる |
| C(採用) | `Required approvals: 1 → 0` | PR 経由は強制、approval 任意。admin 特権を増やさず最小変更 |
| D | bypass actors に自分(user)を追加 | B と実質同じ。user 単位の方が明示的だが本質的なガード弱化は変わらない |

## Notes

- 対象 ruleset id: `17011388`(`gh api repos/takagiyuuki/portfolio/rulesets` で参照可能)
- `protect-main` の他のルール(force push 禁止、deletion 禁止)は維持
- CI checks 必須化は Phase 1 以降(GitHub Actions 導入時)に別 ADR で扱う

## References

- `docs/ops/github-repo-security.md` — 初版で 1 approval を設定した経緯。本 ADR の決定を反映して更新済み
- [Managing rulesets for a repository — GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets-for-a-repository)
- [Reviewing your own pull request — GitHub Community](https://github.com/orgs/community/discussions/12395) — self-approve が許可されない GitHub 側の制約
