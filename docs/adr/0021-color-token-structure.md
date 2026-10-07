# ADR-0021: カラートークンを primitive と semantic の 2 層に分け、hover の規則を 1 つにする

Date: 2026-10-07
Status: Accepted

## Context

色のトークンは `src/styles/global.css` の `:root` に hex で直接書かれ、ライトの値を
`@media (prefers-color-scheme: dark)` で上書きしていた。

| トークン | 使われている場所 |
| --- | --- |
| `--background` / `--foreground` | `html` |
| `--foreground-muted` | footer、nav の非アクティブ項目 |
| `--link` | 本文リンク、nav の現在地 |
| `--link-hover` | 本文リンクの hover |
| `--border` | どこにもない |
| `--social-icon` | footer のアイコン（値は `var(--foreground-muted)`） |

この構成には次の問題があった。

- **`--link` が nav の現在地にも使われている。** 現在地はリンク先ではないので、名前が
  役割の半分しか表していない
- **`--border` は定義されているだけで、一度も参照されていない**
- **`--social-icon` は使う場所で付けた名前である。** ADR-0019 は「トークン名は『どこで
  使うか』ではなく『何であるか』で付ける」と決めており、パレットを変える作業で置き換えると
  予告されていた
- **nav の現在地が hover で変化しないのは、ソースの順番による。** `nav a:hover` と
  `nav a[aria-current='page']` は詳細度が同じ (0,1,2) で、後に書かれた方が勝っている
- **hover の意味が要素によって揃っていない。** nav は「控えめな色から本文色へ」と強調を
  上げるが、本文リンクは「青からさらに濃い青へ」で、ライトでは変化がほとんど見えない
- **ロゴの hover の `opacity` は、設計意図がなくなっていた。** nav に HOME がなかった頃、
  ロゴがトップページへの唯一のリンクだったために付けたもので、今は nav に HOME がある

ADR-0020 でパレットを Flexoki に変えるのに合わせて、トークンの構造と hover を整理する。

## Decision

### 2 層に分ける

| 層 | ファイル | 中身 |
| --- | --- | --- |
| primitive | `src/styles/flexoki.css` | パレットの色の名前と値（`--flexoki-*`）。使う色だけ |
| semantic | `src/styles/global.css` | 用途の名前（`--color-*`）と、ライト / ダークそれぞれの割り当て |

- `flexoki.css` にはメディアクエリを書かない。ライト / ダークの切り替えは semantic 層だけが行う
- `global.css` の先頭（`@import 'tailwindcss';` の直後）で `@import './flexoki.css';` する。
  `@import` は他のルールより前にしか書けず、後ろに書くとエラーにならずに無視される。
  ビルド時に 1 つの CSS に結合されるので、リクエストは増えない
- コンポーネントは semantic token だけを参照する

### semantic token

`--color-bg` / `--color-text` / `--color-text-muted` / `--color-accent` / `--color-selection`
の 5 つ。値と用途の一覧は `.claude/rules/design.md` にある。

- **`--color-` を接頭辞にする。** `--text-*` は文字サイズ（`--text-body` など）で使われて
  おり、接頭辞がないと色かサイズか読み分けられない
- **`link` ではなく `accent` にする。** リンクと現在地の両方を含む名前にする
- **使われないトークンは定義しない。** トークンを定義しただけでは何も描画されず、表示する
  要素がなければブラウザで確認もできない。将来の要素（表、コードブロックなど）に使う色は
  `design.md` に先に決めておき、要素が現れたときに確認しながら追加する

この方針に従い、`--link-hover`（本文リンクの hover で色を変えなくなる）、`--border`
（使われていない。表を書くときに `--color-border` として追加する）、`--social-icon`
（`--color-text-muted` と同じ値の別名）を削除する。

### hover の規則

> **hover は強調を最大まで上げる。すでに最大なら変えない。合図は要素ごとに 1 つにする。**

- **chrome（nav の非アクティブ項目、footer のアイコン）は、muted から本文色に変える。**
  合図は色だけにする。Flexoki では muted と本文の差がライト 3.75 / ダーク 2.31 あり、
  色の変化だけで知覚できる（ADR-0020 の選定基準 4）。色と下線を同時に変えると、合図が
  重なってうるさい
- **本文リンクは変えない。** 普段から accent と下線で強調が最大になっている。同じ色相の
  まま色を変える hover は、ライトでは暗くすると知覚できず、明るくすると AA を下回るので、
  色では強調を上げられない。合図はブラウザ標準のポインタカーソルに任せる
- **nav の現在地は変えない。** 同じページを開き直すだけのリンクを押せるように見せない。
  `nav a:not([aria-current='page']):hover` で除外し、ソースの順番に依存しないようにする
- キーボード操作のフォーカスは、ブラウザ標準のフォーカスリングで示す（`outline: none` を
  書かない）。ロゴの hover の `opacity` もこれに合わせて削除する

### 本文リンクの下線はフォントの推奨値を使う

`text-underline-offset` と `text-decoration-thickness` を指定しない。位置と太さはフォントの
設計者が文字に合わせて決めた値であり、Inter では g / q などのディセンダーが下線を切って
突き抜ける位置に引かれる。

### 色の運用ルール

1. コンポーネントは semantic token（`--color-*`）だけを参照する。primitive（`--flexoki-*`）
   や色の値を直接書かない
2. 色を表現するために `opacity` を使わない。重ねる背景によって実際の色が変わり、測った
   比率が成り立たなくなる
3. 新しい文字色と背景色の組み合わせを作るときは、比率を一度計算して `global.css` の
   割り当ての隣にコメントで書く。AA（4.5:1）を目標にする

AA は個人サイトの努力目標として扱い、コントラストの自動テストは書かない。#23 の受け入れ
条件（Lighthouse の Accessibility ≥ 95）がコントラストの監査を含むので、そこで確認する。

### 今のルールは `.claude/rules/design.md` に置く

トークンの一覧、要素ごとの色、hover の表、将来追加する要素の色は `.claude/rules/design.md`
に置き、要素が増えるたびに更新する。ADR は判断と理由の記録として扱う。

`.claude/rules/` は Claude Code が起動時に自動で読み込むディレクトリである。`.gitignore` の
`.claude/` を `.claude/*` と `!.claude/rules/` に変え、`rules/` だけを Git で管理する。
`settings.local.json` などの個人設定は引き続き Git の外に置く。

## Rationale

### 却下した案: テーマファイルが semantic token を定義する

`flexoki.css` に `--color-*` のライト / ダークの割り当てまで持たせれば、`@import` の
1 行でテーマを切り替えられる。しかし、サイト全体で使う変数が `global.css` 以外のファイルで
宣言されることになり、「`global.css` を見ればサイトの変数が全部分かる」という網羅性が
失われる。`flexoki.css` は外部データ（パレット）のコピー、`global.css` はサイトの判断
（どの色をどの用途に使うか）という分け方を優先する。

### 却下した案: primitive と semantic の間に中間層を置く

`--color-palette-bg: var(--flexoki-paper)` のような中間層を置き、semantic 層から参照する案。
semantic 層と中間層の対応が 1 対 1 なので、名前を付け替えているだけで何もしていない。
テーマの 1 色を複数の用途に分ける（たとえばリンクと現在地を別の色にする）必要が出たとき、
つまり対応が 1 対 1 でなくなったときに追加する。

## Consequences

- **テーマを変えるときは、`@import` の行と `global.css` の割り当てを書き換える。** どの段階
  なら AA を満たすかはパレットごとに測り直す必要があるので、割り当てを見直さずにテーマを
  変えられないのは意図した制約である
- **トークンの比率の保証は、測った組み合わせに限られる。** たとえば muted を将来の
  `bg-2` の上に置くと、ライトで AA を下回る（ADR-0020）。運用ルール 3 で、組み合わせ
  ごとに確認する
- **本文リンクには、CSS による hover の見た目の変化がない。** 合図はポインタカーソルだけになる
- **chrome の hover は、muted と本文の明度差だけに頼る。** パレットを変えるときは
  ADR-0020 の選定基準 4 を確認しないと、nav とアイコンの hover が見えなくなる
- 自動テストがないので、AA を下回る変更はレビューか #23 の Lighthouse の計測でしか
  見つからない

## Related

- ADR-0015: CSS-first — `:root` のトークンと `@layer base` の要素スタイル
- ADR-0019: chrome の書体。トークンの命名規則と `--social-icon` の予告
- ADR-0020: カラーパレットに Flexoki を採用する
- `.claude/rules/design.md`: 色のルールの現在の一覧
- #23: Lighthouse ≥ 95
- #132: `design.md` の色以外のルールの見直し
