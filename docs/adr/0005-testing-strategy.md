# ADR-0005: Testing Strategy - Vitest + Playwright

Date: 2026-04-27
Status: Accepted

## Context

SSG ポートフォリオサイトにおいてテスト戦略を定める。
動的バックエンドがないため、テストの主な対象はユーティリティ関数と E2E の表示確認となる。

## Decision

- Unit test: Vitest 3.x（`src/**/*.{test,spec}.ts`）
- E2E test: Playwright（`tests/e2e/`）

## Rationale

- Vitest は Vite ベースのため Astro との相性が良く、設定がほぼ不要
- Playwright は Astro 公式ドキュメントの推奨 E2E フレームワーク
- Jest は不採用（Vite ecosystem との統合で設定コストが高い）
- Cypress は不採用（重量級、SSG 用途ではオーバースペック）
- Phase 1 では最小構成のみ。CI 統合は Phase 2 以降で追加

## Consequences

### Positive

- ゼロコンフィグに近い（Vite config を共有）
- Playwright は Chrome/Safari/Firefox 対応でブルタリストデザインのレイアウト確認に使える

### Negative

- SSG サイトでは unit test の対象が限られ、E2E 偏重になりやすい
- Playwright の初回セットアップに `pnpm exec playwright install` が必要
