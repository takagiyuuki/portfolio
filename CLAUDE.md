# Project: yukit.dev

ポートフォリオサイト。Astro 製 SSG、Cloudflare Workers ホスト。
SRE/Platform Engineer 志望のアピールを兼ねた運用・IaC 重視構成。

## Goals

- 自己紹介、自作 Web アプリ・GitHub リポ・Zenn 記事へのリンクを掲載
- ページ構成は `/`（自己紹介 + Timeline ダイジェスト）/ `/en/` / `/work/` / `/timeline/` の 4 枚。
  `/about/` は `/` に統合済み。nav は Home / Work / Timeline。ADR-0017 参照
- アクティビティ Timeline（GitHub/Zenn 等の活動を時系列表示）を優先実装。ブログ一覧ページ（`/writing`）は Zenn 記事数が増えるまで保留
- SSG（動的処理は将来的に Workers Functions で追加可能)
- 日英バイリンガル（URL 分離。`/` = 日本語、`/en/` = 英語。併記・トグル・Astro 公式 i18n は
  いずれも不採用）。ADR-0018 参照
- ミニマルデザイン、ライト/ダーク両対応（OS の prefers-color-scheme
  に追従、ユーザートグル UI は置かない）
- インフラ運用・IaC・CI/CD の品質で技術アピール

## Non-Goals

- 動的バックエンド（DB / API / 認証）は不要
- React Islands はデフォルト不要、必要時のみ追加
- ダークモードのユーザー切替 UI は実装しない（OS 設定に追従するのみ）
- 現状 Storybook 不要

## Stack

- **Framework**: Astro 7.x（React Islands は使用箇所限定）
- **Language**: TypeScript 5（strict）
- **CSS**: CSS-first（`:root` トークン + `@layer base` 要素スタイル + Astro scoped CSS）。Tailwind v4 は
  Preflight とレイヤー順宣言のみに使用し、utility class と `@theme` は使わない。ADR-0004 / ADR-0015 参照
- **Content**: ブログ記事は本リポで管理しない（別リポ `takagiyuuki/blog` + Zenn 公開、`/writing` は外部記事の index のみ。`src/content/writing/` の
  MDX collection は作らない）。ADR-0012 参照。これは blog に限った決定であり、Work エントリなど他用途の Content Collections は禁じていない
- **i18n**: URL 分離（`src/pages/en/` を素のファイルルーティングで置く）。Astro 公式 i18n の統合
  機能・設定は使わない（SSG では `Astro.preferredLocale` が使えず、翻訳対象が `/` の 1 枚のみで
  fallback routing の価値も発生しないため）。JS トグルも localStorage も使わない。
  言語リンクは各ページの `<h1>` 直後に置く。ADR-0018 参照
- **Lint+Format**: Biome 2.x（ESLint/Prettier は使わない）
- **Test**: Vitest 3 + Playwright
- **Git Hooks**: lefthook（Husky 不使用）
- **Package Manager**: pnpm 9.x（npm/yarn/bun は使わない。Cloudflare 推奨に準拠）
- **VCS**: Git（単独運用。jj からの移行は ADR-0013 を参照）
  - Git ワークフロー学習のため jj colocated から Git-only へ移行済み
  - GitHub 連携は `git push` / `git fetch` / `gh`
- **開発環境**: Nix flakes + direnv + nix-direnv
- **Hosting**: Cloudflare Workers (Static Assets)
- **Deploy**: GitHub Actions + Wrangler（Cloudflare API Token 認証。Workers OIDC が GA に到達したら再評価)
- **IaC**: Terraform 1.x（メイン）+ cloudflare provider v5
- OpenTofu 互換性を CI で継続検証（dual-IaC）
- HashiCorp BSL ライセンス問題への対応策として OpenTofu 動向を追跡
- **tfstate**: R2 backend
- **Renovate**: 採用、自動マージポリシー設定予定

詳細は `@.claude/rules/stack.md` を参照（必要時に作成）。

## Coding Conventions

- インデント 2 スペース
- TypeScript strict、`any` は使わない（やむを得ない場合は `unknown` + 型ガード）
- import 順序は Biome の `organizeImports` に従う
- コミットメッセージは Conventional Commits（英語）
- コード内コメントも英語
- Astro コンポーネントの命名は PascalCase

## Design Rules（ミニマル）

- 背景・テキスト: ライト/ダークで切替
  - ライト: 背景 `#ffffff`、テキスト `#171717`
  - ダーク: 背景 `#0a0a0a`、テキスト `#e5e5e5`
- フォント:
  - 英: Inter
  - 日: Noto Sans JP
  - 配信: Google Fonts でまとめて配信
  - フォントスタック例: `"Inter", "Noto Sans JP", system-ui, sans-serif`
- リンク（下線常時表示、hover で下線太く + 色変化）:
  - ライト: 通常 `#1d4ed8`（blue-700）、hover `#1e3a8a`（blue-900）
  - ダーク: 通常 `#60a5fa`（blue-400）、hover `#93c5fd`（blue-300）
- 罫線: 必要箇所のみ細い線。ライト `#e5e5e5`、ダーク `#262626`。構造可視化のための装飾的な罫線は使わない
- セクション区切り: 罫線ではなく余白で行う
- 装飾（美意識としての方針。妥協・変更してよい）: `border-radius` は原則 0、`box-shadow`、
  `gradient` は使わない。ミニマル志向の趣味的な選択であり、必要が生じたら見直す
- アニメーション（性能制約。原則として変更しない）:
  - **何を動かすか**で判断する。アニメーションの有無や見た目の派手さでは判断しない
  - 動かしてよいプロパティ: `transform` / `opacity`（コンポジタで処理され、レイアウトも paint も
    起きない）、および `color` / `text-decoration-*` などレイアウトを伴わないもの
  - 動かしてはいけないプロパティ: `width` / `height` / `top` / `left` / `margin` など
    レイアウトを誘発するもの（毎フレーム再レイアウトが走る）
  - `scroll` イベントリスナーを書かない。追従 UI は `position: sticky`（CSS のみ、JS 不要）、
    出現・可視判定は `IntersectionObserver` を使う
  - duration は 150ms 程度を目安にする
  - `@media (prefers-reduced-motion: reduce)` でアニメーションを無効化する
- レイアウト: 左寄せ、最大幅 65ch（本文）、行間は `--leading-body`（1.625）
- 文字サイズ: 本文 18px を基準、見出しは控えめな階層
- ダークモード: `@media (prefers-color-scheme: dark)` で CSS 変数を上書き。JSなし、ユーザートグル UI なし
- デザイントークンは `src/styles/global.css` の `:root` に集約。コンポーネント側は `var(--foreground)` 等を参照し、色の直値を書かない

詳細は `@.claude/rules/design.md` を参照（必要時に作成）。

- Git 単独で管理（ADR-0013）
- 作業ブランチ作成: `git switch -c <type>/<topic>`
- コミット: `git add <path>` → `git commit -m "..."`（Conventional Commits）
- push: `git push -u origin <branch>`
- リモート同期: `git fetch` / `git pull`
- リベース: `git rebase main`
- PR は GitHub で作成（`gh pr create`）、CI は GitHub Actions
- 開発サーバ起動: `pnpm dev`
- ビルド: `pnpm build`
- テスト: `pnpm test`、E2E: `pnpm test:e2e`
- フォーマット: `biome check --write .`

詳細は `@.claude/rules/workflows.md` を参照（必要時に作成）。

## Constraints / 重要な制約

- **言語**: チャット応答は日本語、コミットメッセージとコードコメントは英語
- **回答スタイル**: 結論先出し、簡潔、ハルシネーション禁止、不明な点は不明と答える
- **依存追加**: 安易に依存を増やさない。代替検討と必要性の説明を必ずする
- **コード生成**: 詳細設計を先にしてから実装。production-quality・完全動作を優先
- **計算・文字数カウント**: Python を使用
- **ESLint・Prettier・Husky を導入しない**（Biome と lefthook を使用）
- **npm・yarn・bun を使わない**（pnpm のみ）
- **IaC は Terraform を主軸とする。OpenTofu 互換性は CI で確認するが、メインの開発は Terraform で行う**
- **ファイルの自律的な作成・修正を行わない**: このリポジトリは学習を兼ねているため、Claude がファイルを直接作成・編集することは原則禁止。実装が必要なコードはチャットで提示し、実装はユーザーが行う。実装後にレビューを行うこと。

## Agent skills

### Issue tracker

Issues and PRDs are tracked as GitHub issues at `takagiyuuki/portfolio` via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles map 1:1 to GitHub label names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` and one `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Key References

- @.claude/rules/stack.md 技術スタック詳細（必要時作成）
- @.claude/rules/design.md ミニマルデザインガイド（必要時作成）
- @.claude/rules/infrastructure.md OpenTofu / Cloudflare 構成（必要時作成）
- @.claude/rules/workflows.md Git / Nix / pnpm の使い方（必要時作成）
- @docs/adr/ アーキテクチャ判断記録
