# ADR-0009: PR-time CI required, push: main trigger not adopted

## Status

Accepted (2026-06-11)

## Context

Phase 0 PR の merge 時点で `.github/workflows/` 配下に CI workflow が存在せず、Required status checks が無いまま merge ボタンが押せた。lefthook の pre-commit hook は存在するが `--no-verify` で回避可能なため、PR の品質ゲートにはなり得ない。

PRD #1 では `_deploy.yml` (M4, push-to-main) と `iac.yml` (M5, Terraform PR) のみ計画されており、アプリコードに対する PR-time CI は計画外だった。デプロイ workflow を導入する前に品質ゲートを設置する必要がある。

## Decision

`.github/workflows/ci.yml` を新設し、以下の構成で PR-time CI を実装する。

### Triggers
- `pull_request: branches: [main]` のみ
- `push: main` は採用しない(将来の `_deploy.yml` と二重起動になるため)

### Jobs
- `check` (matrix): 4 種の品質 check を並列実行
  - `lint`: `biome check .`
  - `typecheck`: `astro check`
  - `build`: `astro build`
  - `test`: `vitest run --passWithNoTests`
- `ci-pass` (gate job): `needs: check` + `if: always()` で matrix 全 cell の結果を 1 つの status check に集約

### Reuse strategy
- Setup ステップ列(pnpm/Node/install)は `.github/actions/setup/` に composite action として抽出
- Node version は `.nvmrc`(現在 `24`)、pnpm version は `package.json` の `packageManager`("pnpm@11.1.2")で固定

### Branch protection
- `protect-main` ruleset の Required status checks には **`ci-pass` の 1 つだけ** 指定
  - matrix cell を増減しても ruleset 設定変更不要

### Security
- `permissions: contents: read` で GITHUB_TOKEN を最小権限化
- `concurrency` で同一 PR の古い run を cancel
- gate job の bash では `${{ }}` を直接展開せず `env:` 経由で参照(script injection 対策)

## Consequences

### Positive
- merge 前に lint/typecheck/build/test の通過が GitHub によって強制される
- matrix cell の増減で ruleset を触らない設計(gate job が吸収)
- composite action による DRY、setup ロジックの変更が 1 ヶ所で済む
- `--no-verify` で lefthook を skip しても CI で再検査される

### Negative
- gate job 起動分のオーバーヘッド(+~10s)
- 各 matrix cell で `pnpm install` を重複実行(setup-node の pnpm cache で軽減)

### Deferred
- GitHub Actions の SHA pin 化(SLSA Level 3 準拠)は Renovate 導入 (#30) 後に別 Issue で実施
- E2E (Playwright) は `_deploy.yml` の post-deploy job 側で対応(PRD M4)
- IaC (Terraform/OpenTofu) の validation は S22 (#23) の `iac.yml` で対応
- Nix flake と `.nvmrc`/`packageManager` の二重管理を将来 Nix 統一する案は別 Issue で起票
- vitest テスト実装 + `--passWithNoTests` フラグ除去は別 Issue で起票
- jj 環境での pre-push 相当の wrapper script は #33 で対応
- jj fix による formatter 統合は #34 で対応

## Alternatives Considered

| 案 | 概要 | 採否 |
|---|---|---|
| 4 ジョブ個別宣言 | setup を 4 回コピペ | ✖ DRY 違反、ruleset に 4 件列挙が必要 |
| Reusable workflow | `workflow_call` で関数化 | ✖ check 名が `<caller> / <reusable>` で煩雑、起動 overhead 大 |
| Matrix のみ(gate なし) | check (lint) 等 4 件を直接 Required | ✖ matrix 拡張時に ruleset 更新が必要 |
| **Matrix + gate job** | matrix 並列 → `ci-pass` で集約 | ✓ **採用** |

## References

- Issue #31
- ADR-0008: Branch protection policy
- [GitHub Docs - Required status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets#require-status-checks-to-pass-before-merging)
- [GitHub Security - Script injection prevention](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-an-intermediate-environment-variable)
