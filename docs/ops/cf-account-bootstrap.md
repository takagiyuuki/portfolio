# Cloudflare Account Bootstrap

One-time setup procedure for provisioning the Cloudflare credentials used by CI/CD and Terraform.
Secret values are never stored here — record them in a secure location (e.g. password manager).

## Prerequisites

- Cloudflare account with yukit.dev zone registered
- GitHub repository admin access

## 1. Enable 2FA on Cloudflare account

My Profile → Authentication → Two-Factor Authentication → Enable

## 2. Issue Cloudflare API Token (Wrangler / GitHub Actions)

**Token type:** User API Token. See [ADR-0007](../adr/0007-cloudflare-api-token-type.md) for why not Account API Token.

My Profile → API Tokens → Create Token → Create Custom Token

**Token name:** `yukit-dev-github-actions`

**Permissions:**

| Category | Permission | Level |
|---|---|---|
| Account | Workers Scripts | Edit |
| Account | Workers R2 Storage | Edit |
| Zone | Zone | Read |
| Zone | DNS | Edit |

**Zone Resources (for Zone-scoped permissions):** Include → Specific zone → yukit.dev

**Client IP Address Filtering:** leave empty (GitHub Actions IPs are not fixed)

**TTL:** 1 year (rotate annually; record expiry in password manager)

Copy the token immediately — it is shown only once.

## 3. Obtain Account ID

Workers & Pages → Account details (right sidebar) → Copy Account ID

## 4. Create R2 bucket for Terraform tfstate

R2 Object Storage → Create bucket

| Field | Value |
|---|---|
| Bucket name | `tfstate-yukit-dev` |
| Location | Automatic |

## 5. Issue R2 API Token (Terraform backend)

R2 Object Storage → Manage R2 API Tokens → Create API Token

| Field | Value |
|---|---|
| Token name | `terraform-tfstate` |
| Permissions | Object Read & Write |
| Specify bucket(s) | `tfstate-yukit-dev` only |
| TTL | 1 year |
| Client IP Address Filtering | empty |

On creation, capture the following (shown only once):

- `Access Key ID`
- `Secret Access Key`

The `Endpoint URL` is not secret and can be retrieved later from `R2 → bucket → Settings → S3 API`, or constructed as `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

## 6. Configure GitHub Environment

Repository Settings → Environments → New environment → `production`

**Protection rules:**
- Deployment branches and tags: Selected branches and tags → `main`

**Environment secrets:**

| Name | Source | Used by |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | step 2 | Wrangler deploy |
| `CLOUDFLARE_ACCOUNT_ID` | step 3 | Wrangler / Terraform |
| `R2_ACCESS_KEY_ID` | step 5 | Terraform S3 backend |
| `R2_SECRET_ACCESS_KEY` | step 5 | Terraform S3 backend |

## 7. Referencing secrets in GitHub Actions

```yaml
jobs:
  deploy:
    environment: production
    steps:
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

For Terraform jobs, expose R2 keys as `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` env vars so the S3-compatible backend picks them up.

## Token rotation

| Token | Rotation steps |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Issue new token (same scopes) → update GitHub Secret → revoke old token |
| R2 API Token | Issue new token (same scopes) → update `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` in GitHub Secrets → revoke old token |

Rotate annually before TTL expiry, or immediately on suspected compromise.
