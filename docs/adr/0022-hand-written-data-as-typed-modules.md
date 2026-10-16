# ADR-0022: 本文を持たない手書きデータは、Content Collection ではなく型付きの TS モジュールに置く

Date: 2026-10-16
Status: Accepted

## Context

Work ページ（#19）は当初、`src/content/work/` の Content Collection に 1 エントリ 1 ファイルで
置く計画だった（ADR-0018 の Consequences も「Content Collection のまま」と書いている）。

実装にあたって Astro 7.3.5 の `file()` loader（`node_modules/astro/dist/content/loaders/file.js`）
を読み、次の挙動を確認した。

- **データファイルのパースに失敗しても、ビルドは止まらない。** `logger.error` を出して
  `return` するだけで、コレクションは空のまま成功する
- **配列の要素に `id` が無いと、その要素だけ黙って読み飛ばす**
- スキーマに `z.object` を使うと、**未知のキーは黙って捨てられる**（Zod の既定の挙動）。
  `article` を `artcle` と書き間違えると、記事へのリンクだけが消える

いずれも「壊れたまま、成功したビルドがデプロイされる」経路である。また、Work のエントリは
本文を持たない（ADR-0017 により詳細ページを作らない）ので、Markdown の本文を使う場面がない。

## Decision

### 本文を持たない手書きデータは `src/data/*.ts` に置く

- データは型注釈を付けた配列として書く。例: `export const work: readonly [WorkEntry, ...WorkEntry[]] = [...]`
- 表示順は配列の順序で表す。順序用のフィールドは持たない
- 対象は**本文を持たないレコードの一覧**に限る。本文を持つ文書を扱うときに Content Collection
  を使うことは妨げない（Markdown の本文と frontmatter のスキーマ検証という、Content Collection
  の利点が活きるため）

### 検査はまず型で表す

型で表せる検査は型で行い、実行時の検証を書かない。Work では次をすべて型で検出している。

| 壊れ方 | 型 |
| --- | --- |
| キーの綴り間違い、必須フィールドの欠落 | 型注釈の excess property check |
| `https` 以外の URL | `` type HttpsUrl = `https://${string}` `` |
| 空の配列（tech、エントリ全体） | 非空タプル `readonly [T, ...T[]]` |

**`astro build` は型を検査しない**（esbuild は型を取り除くだけ）。型による検査が効くのは、
`astro check` が走る pre-commit（lefthook）・pre-push（`pnpm verify`）・PR CI の `typecheck`
の 3 箇所である。

### 実行時の検証とテストは、型で表せない場合とロジックがある場合に限る

- 型で表せない検査（実在する日付か、など）だけを Zod で実行時に検証する。`z` は Content
  Collection の外でも `astro/zod` から import できる
- テストはロジック（統合・並べ替え・重複除去・取得失敗時の扱いなど）を守るために書く。
  データを型付きで並べるだけのファイルにはテストを書かない

Timeline の手書きエントリ（feat/timeline-page の `src/data/timeline.ts`）も同じ決まりに従う。
Timeline には複数のソースを統合するロジックがあるので、検証とテストを持つ。

## Rationale

### 却下した案: Content Collection + YAML（`file()` loader）

YAML の配列 1 枚に全件を書き、`file()` loader で読む案。並び順を配列で表せる点は同じだが、
Context の 3 つの経路が残る。パース失敗はエントリ数が 0 件ならページ側で検出できても、
`id` の欠落と未知のキーは 1 件以上残るので検出できない。YAML を Vitest で直接検証するには
js-yaml を直接の依存に加える必要があり、しかも Astro と同じパース経路を検査していることには
ならない。

### 却下した案: GitHub API から `showcase` トピックのリポジトリを取得する

Timeline と同じトピックで掲載対象を決め、description と homepage を流用する案。表示名
（`portfolio` ではなく `yukit.dev`）と tech の表記（`cloudflare-workers` ではなく
`Cloudflare Workers`）には結局手書きの対応表が要り、ビルドが外部 API に依存し、掲載内容の
変更が PR を通らなくなる。エントリ数が少ないうちは見合わない。再検討の条件は #137 にある。

## Consequences

- **データの変更は、型検査が通らないと main に入らない。** 型エラーのあるデータを
  ローカルで `astro build` すると成功するので、ビルドの成功を検査の代わりにしない
- **型で表せない誤り（形式は正しいがリンク先が違う URL など）は、どの段階でも検出されない。**
  目視で確認する
- Work の掲載リストと Timeline の `showcase` トピックは、どちらも「見せたいリポジトリ」を
  表しており、別々に管理している。当面は手で揃える（#137）
- ADR-0018 の Consequences の「#19 は Content Collection のまま」は、本 ADR で置き換える

## Related

- ADR-0012: ブログ記事は本リポで管理しない（`src/content/writing/` を作らない）
- ADR-0017: Work の詳細ページは作らない
- ADR-0018: #19 は Content Collection のまま（本 ADR で置き換え）
- #19: Work ページ
- #137: Work の掲載リストを GitHub の `showcase` トピックから取得するか再検討する
