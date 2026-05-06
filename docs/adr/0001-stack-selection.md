# ADR-0001: Stack Selection

Date: 2026-04-25
Status: Accepted

## Context

ポートフォリオサイトの再構築にあたり、以下の制約と志望が前提:

- 用途: 自己紹介・ブログ・作品リンク
- 配信形態: SSG で十分
- ホスティング: Cloudflare
- 志望ポジション: SRE / Platform Engineer / Cloud

## Decision

- Framework: Astro 5.x（Next.js は要件に対しオーバースペック）
- Hosting: Cloudflare Workers (Static Assets)（Pages は新機能投資が縮小）
- IaC: Terraform 1.x をメイン採用、OpenTofu 互換性を CI で検証
  - 日本の SRE/Platform 求人で Terraform が事実上の標準のため
  - OpenTofu は知識として保持、ライセンス問題への対応策として CI に組み込み
- VCS: Jujutsu (jj) colocated（個人開発の生産性、Git 互換）
- Dev Env: Nix flakes（CI/ローカル一致の保証、SRE 文脈で評価される）
- Package Manager: pnpm（Cloudflare 公式推奨、disk 効率、生態系成熟）
  - Bun は本番ランタイムとして Workers で動かないため、ローカル限定採用は中途半端と判断
- Lint/Format: Biome 2.x（ESLint+Prettier 統合）

## Consequences

### Positive

- スタックがシンプルで、Cloudflare との接続点が最小
- IaC + 観測 + ガバナンスで SRE/Platform 職への直接アピールが可能

### Negative

- jj / Nix は採用担当によっては未知の技術、説明コスト発生の可能性
- React Islands を入れない場合、モダン FE 文脈のアピールは弱まる（志望が SRE 寄りなので許容）
