# ADR-0010: Renovate 採用 / Dependabot version updates 無効化

## Status

Accepted (2026-06-26)

## Context

Phase 0 merge 直後、`.github/dependabot.yml` を配置していないにもかかわらず `dependabot[bot]` が PR #28 (`vitest 3.2.4 → 4.1.0`) を起票した。GitHub UI 経由で Dependabot version updates が暗黙に有効化されていたと推定される（PR #28 は既に close 済み）。

依存更新ツールを1つに統一する必要がある。Dependabot と Renovate を併用すると同一依存に対し重複 PR が発生するため。

本プロジェクト固有の事情として、Dependabot では扱えない更新対象がある:

- **Nix flake.lock**: 本プロジェクトは Nix flakes を採用。flake.lock を更新できる manager は Renovate にしか存在しない。
- **Terraform provider lock (`.terraform.lock.hcl`)**: provider lock の更新は Renovate の方が安定して扱える。
- ソロ + AI 協業のため、全保留更新を1つの issue に集約する **Dependency Dashboard** の運用効果が大きい。

## Decision

依存更新を **Renovate (SaaS / GitHub App) に統一**し、Dependabot version updates を無効化する。

### renovate.json

repo 直下に `renovate.json` を配置する。主要設定:

- `extends: ["config:recommended"]` — 現行推奨プリセット（Dependency Dashboard を内包）
- `timezone: "Asia/Tokyo"` / `schedule: ["before 6am on monday"]` — 週次集約でノイズ抑制（JST 基準）
- `rangeStrategy: "bump"` — lockfile だけでなく `package.json` の range も追従させる
- `lockFileMaintenance: { enabled: true, schedule: [...] }` — flake.lock / pnpm-lock.yaml の定期更新
  - lockFileMaintenance は top-level `schedule` を継承しないため、内側にも schedule を明示
- `nix: { enabled: true }` — **Nix manager は beta / opt-in でデフォルト無効**。明示有効化しないと flake.lock 更新 PR が起票されない
- npm / github-actions / terraform manager は config:recommended でデフォルト有効

### automerge ポリシー（初期案）

`platformAutomerge`（既定有効）により GitHub auto-merge を利用し、`ci-pass` (ADR-0009) 通過後に自動マージする:

- devDependencies の patch + minor → automerge
- GitHub Actions の digest / pin 更新 → automerge
- production dependencies および major → ルール無し = 手動レビュー

automerge が成立する前提は ADR-0008（required approvals = 0、PR-required ON）。レビュー必須が 0 のため、`ci-pass` が通れば自動マージが完了する。

### Dependabot

- **version updates: OFF**（Settings → Code security）
- **security updates: ON 維持**（CVE alert 補完用。Renovate の vulnerability alert と二重になり得るが、CVE 検知の取りこぼし防止として残す）

### 設定検証

`renovate-config-validator --strict` を on-demand で実行する。`package.json` に `renovate:validate` script (`pnpm dlx` 経由) を用意。

- 検証は設定変更時の手動運用とし、CI / pre-commit には組み込まない（dlx のダウンロード負荷が重いため）
- validator は構文を検証するが、不明な manager 名のタイポ（永遠にマッチしないルール）等のロジック誤りは検出しない点に留意

## Consequences

### Positive

- 依存更新ツールが1つに統一され、重複 PR が解消される
- flake.lock / Terraform provider lock を含む全依存を単一ツールで管理できる
- Dependency Dashboard により保留更新を1 issue で俯瞰できる（ソロ + AI 運用に有効）
- devDeps patch/minor と GHA digest は CI 通過後に自動マージされ、手作業が減る

### Negative

- 初回スキャンは PR が多数起票される傾向がある（`schedule` 週次 + Dependency Dashboard で緩和）
- Nix manager は beta であり、挙動が将来変わる可能性がある
- `renovate:validate` は dlx 実行のためネットワーク必須・初回が遅い

### Deferred

- automerge ポリシーの最終調整（運用後の tuning）は別 Issue
- `prHourlyLimit` / `prConcurrentLimit` による PR 数抑制は、初回スキャンの挙動を見て必要なら別 Issue で対応
- GitHub Actions の SHA pin 化（ADR-0009 で deferred）は別 Issue。pin 化後に GHA digest automerge ルールが実効化する
- Renovate config 検証の CI / pre-commit 組み込みは別 Issue
- Renovate self-host は採用しない（SaaS 版で十分）

## Alternatives Considered

| 案 | 概要 | 採否 |
|---|---|---|
| Dependabot 継続 | `.github/dependabot.yml` を明示配置して Dependabot に統一 | ✖ flake.lock / Terraform provider lock を扱えない、Dependency Dashboard 相当が無い |
| Dependabot + Renovate 併用 | 両方有効のまま | ✖ 同一依存に重複 PR が発生 |
| Renovate self-host | 自前で Renovate を運用 | ✖ ソロ運用には過剰、SaaS で十分 |
| **Renovate SaaS に統一 + Dependabot version updates OFF** | GitHub App + renovate.json | ✓ **採用** |

## References

- Issue #30
- ADR-0008: Branch protection policy（automerge の前提）
- ADR-0009: PR-time CI（`ci-pass` ゲート、GHA SHA pin の deferral）
- [Renovate Nix manager](https://docs.renovatebot.com/modules/manager/nix/)（beta / opt-in）
- [Renovate config:recommended preset](https://docs.renovatebot.com/presets-config/#configrecommended)
- [Renovate FAQ — lockFileMaintenance](https://docs.renovatebot.com/faq/)
