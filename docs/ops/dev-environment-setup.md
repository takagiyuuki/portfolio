# Development Environment Setup

New-machine onboarding for this repository.
Order matters: the Nix devShell must load first, otherwise `node`/`pnpm` are missing for every later step.

## Prerequisites (installed outside the Nix flake)

The flake devShell only provides `node`, `pnpm`, `act`, `actionlint`.
These must be installed on the machine separately:

- Nix (flakes enabled) + direnv + nix-direnv
- Terraform 1.x (S3-compatible R2 backend; OpenTofu optional, see ADR-0002)
- gh (GitHub CLI)
- git (jj optional, colocated)

## 1. Bootstrap the toolchain (gate step)

Install Nix + direnv + nix-direnv, then from the repo root:

```sh
direnv allow
```

This evaluates `flake.nix` and puts `node 24` / `pnpm` / `act` / `actionlint` on PATH.
Nothing below works until this succeeds.

## 2. Secrets & auth

Do this before Terraform init: `terraform init` reads `CLOUDFLARE_ACCOUNT_ID` from `.env`.

- Copy `.env.example` to `.env` and fill in real values (R2 keys, `CLOUDFLARE_API_TOKEN`,
  `CLOUDFLARE_ACCOUNT_ID`). direnv loads `.env` automatically. Issuing steps: `cf-account-bootstrap.md`.
- `gh auth login`
- Register an SSH key with GitHub (`ssh-keygen` → add public key to GitHub account)

## 3. Install dependencies

```sh
pnpm install

terraform -chdir=infra/terraform init \
  -backend-config="endpoint=https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"
```

See `infra/terraform/README.md` for the full list of required Terraform environment variables.

## Verify

```sh
pnpm dev            # Astro dev server
pnpm build          # production build
terraform -chdir=infra/terraform plan   # should show 0 changes
```
