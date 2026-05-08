# ADR-0002: IaC Tooling - Terraform with OpenTofu Compatibility

Date: 2026-04-26
Status: Accepted

## Context

IaC ツールとして Terraform / OpenTofu のいずれを採用するか。

検討時点の状況:

- Terraform は HashiCorp（IBM 傘下）の BSL ライセンス
- OpenTofu は Linux Foundation 配下、機能差は小さい
- 日本の SRE/Platform Engineer 求人では「Terraform 経験」がほぼ標準要件
- OpenTofu は SRE コミュニティで認知拡大中だが、求人要件としてはまだ少数

## Decision

Terraform 1.x をメイン採用する。
ただし、CI で OpenTofu (`tofu` バイナリ) でも plan/apply が通ることを継続検証する（dual-IaC）。

## Rationale

- 転職市場での実用性: Terraform 経験が直接アピールになる
- 互換性検証の価値: OpenTofu 動向を追跡している姿勢を示せる
- リスクヘッジ: 将来的に OpenTofu への完全移行が必要になった場合の備え

## Consequences

### Positive

- 求人票の Terraform 要件にマッチ
- 面接で IaC ツール選定の議論を主導可能（ライセンス問題、OSS 哲学）
- CI の dual-IaC 構成自体が技術アピール材料

### Negative

- CI 実行時間が増える（Terraform / OpenTofu 両方走らせるため）
- 文法差異が発生した場合のメンテナンスコスト
