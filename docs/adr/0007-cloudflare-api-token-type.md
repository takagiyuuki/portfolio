# ADR-0007: Cloudflare API Token Type — User over Account

Date: 2026-05-29
Status: Accepted

## Context

CI/CD で Wrangler が Cloudflare へ Workers をデプロイする際の API Token を発行する必要がある。
Cloudflare には2種類の API Token が存在する。

| | User API Token (`v1.0-` / `cfut_` prefix) | Account API Token (`cfat_` prefix) |
|---|---|---|
| 紐づき | 特定ユーザー | アカウント独立(service principal) |
| ユーザー削除時 | トークンも無効化 | 影響なし |
| 一般的な推奨 | ad-hoc / 個人用途 | CI/CD / 長期サービス |

SRE/Platform 観点では **Account API Token**(service principal)が原則的に正しい。CI/CD クレデンシャルは特定の人間のアイデンティティに依存すべきではない。

## Decision

**User API Token を採用する**。
将来 Cloudflare 側で後述の制約が解消されたら Account API Token に移行する。

## Rationale

Account API Token を採用すべきだが、現時点では Wrangler 側の実装制約により実用上動作しない:

1. **Wrangler が `GET /memberships` を呼ぶ**: Wrangler は内部でアカウント解決のため `/memberships` エンドポイントを呼び出す。このエンドポイントは User スコープにしか存在せず、Account API Token ではアクセス不可。`wrangler deploy` が `[code: 10001]` で失敗する
   - GitHub issue: `cloudflare/workers-sdk#9129`

2. **Cloudflare 公式 Workers Builds も未対応**: Cloudflare 自身の Workers Builds (CI 機能) も、ドキュメントで「account-scoped tokens are not supported and will return Invalid token errors」と明記している
   - https://developers.cloudflare.com/workers/ci-cd/builds/configuration/

3. **UI 不整合**: Account API Token の Custom Permission ピッカーで `Workers Scripts` が表示されないケースが報告されている(段階的ロールアウトか UI バグの可能性)。テンプレート `Edit Cloudflare Workers` 経由なら付与可能だが、最終的に上記1の問題で失敗する

## Consequences

### Positive

- 現実的に動作する構成で CI/CD を組める
- 最小権限の原則は維持(必要なスコープのみに絞った Token)
- 1人運用なのでユーザー依存のリスクは限定的

### Negative

- 厳密な意味での service principal ではない(Token 作成者ユーザーに紐づく)
- Token 作成者のアカウント削除・失効時にデプロイが止まる(現状リスクは低い)

### Mitigation

- TTL を 1年に設定して定期ローテーション
- Cloudflare 側の Wrangler+Account Token 互換性が改善されたら Account API Token へ移行を再評価
- ローテーション手順は `docs/ops/cf-account-bootstrap.md` に記録

## Notes

R2 backend(Terraform tfstate)用の認証は本 ADR の対象外。R2 は S3 互換アクセスキーを `R2 → Manage R2 API tokens` で別途発行し、Terraform backend 設定に渡す。

## References

- [Account-owned tokens · Cloudflare docs](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/)
- [cloudflare/workers-sdk#9129 — Wrangler Fails Deploy with Account Tokens](https://github.com/cloudflare/workers-sdk/issues/9129)
- [Workers Builds configuration — account-scoped token note](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
