# Terraform — Cloudflare infrastructure

Cloudflare のゾーン設定・R2 バケット等を管理する Terraform ルート。
tfstate は R2 (S3-compatible) backend に保存。

## Required environment variables

| 変数                    | 用途                                            |
| ----------------------- | ----------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare provider 認証 (Zone Read / DNS Edit) |
| `CLOUDFLARE_ACCOUNT_ID` | R2 endpoint URL の構築用                        |
| `AWS_ACCESS_KEY_ID`     | R2 access key ID (S3 backend)                   |
| `AWS_SECRET_ACCESS_KEY` | R2 secret access key (S3 backend)               |

トークン発行手順は [`../../docs/ops/cf-account-bootstrap.md`](../../docs/ops/cf-account-bootstrap.md) を参照。

## Working directory

Terraform reads `.tf` files from the current directory. Run commands from this directory:

```sh
cd infra/terraform
```

Or invoke from the repo root with `-chdir`:

```sh
terraform -chdir=infra/terraform <subcommand>
```

The `-chdir` form is preferred in CI scripts that run from the repo root.

## Initialize

```sh
terraform init \
  -backend-config="endpoint=https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"
```

## Plan / Apply

```sh
terraform plan
terraform apply
```

初回 `plan` は data ブロックの zone lookup のみ実行され、変更 0 件のはず。

## Notes

- Provider version: `cloudflare/cloudflare ~> 5.0`
- OpenTofu 互換性は CI で検証 (ADR-0002)
- Backend block uses hardcoded values because Terraform resolves the backend before evaluating variables. Migrate to `-backend-config=*.hcl` (gitignored) when multi-environment support is needed.
