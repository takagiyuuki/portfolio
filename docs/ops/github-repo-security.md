# GitHub Repository Security Hardening

Security checklist for a public SSG repository (Astro + Cloudflare Workers pattern).
Decisions are documented with rationale so the same judgement can be replicated on future projects.

## Applied settings

### Branch protection (Rulesets)

Settings → Rules → Rulesets → New branch ruleset

| Rule | Value | Reason |
|---|---|---|
| Target | `main` | Protect the production branch |
| Restrict deletions | ✅ | Prevent accidental branch deletion |
| Require pull request | ✅, 0 approvals | Enforce PR-based workflow; approval requirement waived for solo + AI workflow (see [ADR-0008](../adr/0008-branch-protection-policy.md)) |
| Block force pushes | ✅ | Preserve commit history |
| Require status checks | Add when CI workflow exists | Gate merges on passing CI |

### GitHub Actions permissions

Settings → Actions → General → Workflow permissions

- Default: **Read repository contents and packages permissions** (read-only)
- `Allow GitHub Actions to create and approve pull requests`: off
- Grant write permissions explicitly per workflow via `permissions:` block in YAML

### Secret scanning & Dependabot

Enabled via `gh` CLI (public repos have secret scanning auto-enabled):

```bash
gh api -X PUT repos/<owner>/<repo>/vulnerability-alerts       # Dependabot alerts
gh api -X PUT repos/<owner>/<repo>/automated-security-fixes   # Dependabot security updates
```

| Feature | Status | Note |
|---|---|---|
| Secret scanning | auto-enabled | Public repos: always on |
| Push protection | auto-enabled | Blocks commits containing secrets |
| Dependabot alerts | enabled | Notifies on vulnerable dependencies |
| Dependabot security updates | enabled | Auto-opens PRs for security fixes |

### GitHub Actions Environment

Settings → Environments → New environment → `production`

| Setting | Value |
|---|---|
| Deployment branches | Selected: `main` only |
| `CLOUDFLARE_API_TOKEN` | Environment secret |
| `CLOUDFLARE_ACCOUNT_ID` | Environment secret |

Reference in workflow:

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

## Intentionally skipped

| Feature | Reason |
|---|---|
| Security policy (SECURITY.md) | For OSS projects with external contributors. Not needed for a personal site |
| Private vulnerability reporting | Same rationale — overkill for a solo portfolio |
| Code scanning (CodeQL) | Scans for code vulnerabilities (SQL injection, XSS, etc.). No backend, no DB, no user data → low signal, high noise for a pure SSG |
| Client IP filtering on Cloudflare token | GitHub Actions IPs are dynamic and not fixed |

## Workflow `permissions:` reference

Declare minimal permissions per job. Common patterns:

```yaml
# Deploy-only workflow
permissions:
  contents: read

# Workflow that posts PR comments
permissions:
  contents: read
  pull-requests: write
```

Never use `permissions: write-all` — grant only what the job needs.
