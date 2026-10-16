# Design Rules（ミニマル）

## トークン

- デザイントークンは `src/styles/global.css` の `:root` に集約する。例外は色の primitive（`src/styles/flexoki.css`）
- コンポーネントはトークンだけを参照し、値を直接書かない（色・書体・サイズ・行間・字間）
- トークン名は「どこで使うか」ではなく「何であるか」で付ける。複数の面で共有する値は概念名
  （`--font-chrome` / `--leading-chrome`）、面ごとに違う実測値は面の名前（`--text-nav` / `--text-footer`）。
  on/off の意思表示（`text-transform: uppercase` など）はトークンにしない（ADR-0019）

## 書体

| 用途 | トークン | 書体 | ウェイト | サブセット |
| --- | --- | --- | --- | --- |
| 本文・見出し | `--font-body` | Inter → Noto Sans JP → `system-ui` → `sans-serif` | 400 / 600 | latin |
| chrome（nav・footer）、tech タグ | `--font-chrome` | VT323 → `monospace` | 400 のみ | latin |

- ウェイトは 400（本文）と 600（見出し・`strong`）の 2 つだけ。増やすときは `astro.config.ts` の宣言も変える
- VT323 を使うのは chrome と Work の tech タグだけ。散文・見出し・`<h1>` は本文側（ADR-0019、ADR-0024）
- VT323 のテキストは latin だけにする。VT323 に CJK のグリフは無く、1 文字ごとに Noto Sans JP に
  フォールバックする。chrome やタグに日本語を足す変更は ADR-0019 の再検討を伴う
- VT323 のテキストは `text-transform: uppercase`。VT323 は小文字の背が低く、視認性が落ちるため。
  表示だけが変わり、DOM の表記（`TypeScript` など）は読み上げとコピーに残る
- Noto Sans JP の `subsets` は指定しない（Astro の既定は `latin`）。Google の CJK は名前の無い
  `unicode-range` スライスで配信されるため、`subsets` では絞れない。latin の文字は Inter が先に
  引き受けるので、Noto の latin スライスは取得されない

### 配信

- `astro.config.ts` の `fonts`（Astro の Fonts API）で宣言する。provider は Google Fonts だが、
  ビルド時に取得して自サイトから配信する。実行時に Google のドメインへは接続しない
- 書体・ウェイト・サブセットを追加するときは、`fonts` の宣言と `<Font>` の両方を変える
- `<link rel="preload">` は、すべてのページの最初に見える領域で使う latin の書体だけに付ける。
  現在は Inter（本文・見出し、400 / 600）と VT323（chrome）の 3 本（`Meta.astro`）
- Noto Sans JP には付けない。Google provider の CJK は 1 ウェイト 121 個の `unicode-range`
  スライスに分かれていて、Astro の `preload` はスライスごとにリンクを出す。preload は
  `unicode-range` を無視して取得させるため、使わない文字も含めて約 5 MB を読み込ませることになる

## 寸法

### 単位

- 本文側（`--font-body` の要素）は `rem`。root は `--text-body`（18px）
- chrome 側（`--font-chrome` の要素。tech タグを含む）は**整数 px**。`font-size` も `letter-spacing` も
  整数にし、タグの `padding` も px で書く。
  VT323 はビットマップ由来で、16.875px のような非整数だと 1px のステムがにじむ。
  `rem` で書くと root 18px との掛け算で非整数になるため使わない

### 文字サイズと行間

| 要素 | トークン | サイズ | 行間 |
| --- | --- | --- | --- |
| 本文 | `--text-body` | 1.125rem（18px） | `--leading-body` 1.625 |
| 小さめの本文（Work の説明文） | `--text-small` | 1rem（16px） | `--leading-body` 1.625 |
| h1 / h2 / h3 | `--text-h1` / `-h2` / `-h3` | 1.75 / 1.5 / 1.25rem | `--leading-heading` 1.3 |
| nav | `--text-nav` | 24px | `--leading-chrome` 1.2 |
| footer | `--text-footer` | 22px | `--leading-chrome` 1.2 |
| tech タグ | `--text-tag` | 18px | `--leading-chrome` 1.2 |

- Work のエントリの見出しは `<h2>` のまま、サイズだけ `--text-h3` にする。一覧の 1 項目の見出しに
  h2 の既定サイズは大きすぎるため。見出しの階層はサイズのために変えない
- tech タグの 18px は VT323 の cap 7.2px にあたる。これより小さくすると潰れやすいので下限とする

- chrome の字間は `--tracking-chrome`（1px）
- nav / footer の `font-size` は本文の 18px より大きいが、cap-height の実寸は本文より小さい
  （VT323 の cap は 0.40 em、Inter は 0.546 em）。**数字の大小を理由に小さくしない。**
  サイズを変えるときは cap-height の実寸で合わせる（ADR-0019）
- `--text-nav` を変えると、nav 1 項目目と本文 1 段落目のベースラインの揃えが崩れる。
  上端の揃いは計算式で保たれるが、ベースラインの揃いは現在の値による偶然（ADR-0019）

### レイアウト

- 左寄せ。本文の最大幅は 65ch
- セクションの区切りは余白で行う

## 色

パレットは [Flexoki](https://stephango.com/flexoki)（MIT）。判断の理由は ADR-0020（パレット）と
ADR-0021（トークンの構造と hover）を参照。

### ファイルの役割

| 層 | ファイル | 中身 |
| --- | --- | --- |
| primitive | `src/styles/flexoki.css` | パレットの色の名前と値（`--flexoki-*`）。使う色だけをコピーする。メディアクエリは書かない |
| semantic | `src/styles/global.css` | 用途の名前（`--color-*`）。`:root` にライト、`@media (prefers-color-scheme: dark)` にダークの割り当て |

ライト / ダークは OS の `prefers-color-scheme` に追従する。JS もユーザートグル UI も使わない。

### semantic token

| トークン | 用途 | ライト | ダーク | 比率（ライト / ダーク） |
| --- | --- | --- | --- | --- |
| `--color-bg` | 背景 | `paper` | `black` | — |
| `--color-text` | 本文 | `black` | `base-200` | 18.62 / 11.98（対 bg） |
| `--color-text-muted` | 控えめな文字 | `base-600` | `base-500` | 4.97 / 5.19（対 bg） |
| `--color-accent` | リンク、現在地 | `cyan-700` | `cyan-400` | 6.03 / 6.70（対 bg） |
| `--color-selection` | 選択の背景 | `cyan-50` | `cyan-950` | 16.20 / 10.64（その上の本文） |
| `--color-border` | 内容の区切りの罫線 | `base-100` | `base-900` | 1.24 / 1.28（対 bg。文字ではない） |
| `--color-tag-text` | tech タグの文字 | `purple-600` | `purple-400` | 6.56 / 5.00（対 tag bg） |
| `--color-tag-bg` | tech タグの背景 | `purple-50` | `purple-950` | — |

ライトの accent は Flexoki 公式の `cyan-600` ではなく `cyan-700`（600 は対 paper 4.43 で AA を下回る）。

`--color-border` は Flexoki の `ui`。`--color-tag-*` は Flexoki が UI の役割を割り当てていない
アクセントの `pu`（ADR-0024）。`bl` はリンクを表す慣習の色で cyan のリンクと混同されるので使わない。

### 要素と色

| 要素 | 色 |
| --- | --- |
| `html` | 背景 `--color-bg`、文字 `--color-text` |
| 本文リンク（`a`） | `--color-accent` + 下線 |
| nav の非アクティブ項目 | `--color-text-muted`、下線なし |
| nav の現在地（`aria-current="page"`） | `--color-accent`。current マーカーも `currentColor` で同じ色 |
| footer のコピーライト | `--color-text-muted` |
| footer のアイコン | `--color-text-muted` |
| 選択（`::selection`） | 背景 `--color-selection`。文字色は変えない |
| `strong` / `em` | 色を付けない（太さと斜体だけ） |
| Work のエントリ間の区切り線 | `--color-border`。エントリの「間」にだけ引き、面や枠では囲まない |
| Work の説明文 | `--color-text-muted` |
| tech タグ | 文字 `--color-tag-text`、背景 `--color-tag-bg`、枠線なし |
| 本文リンクの ↗ と、リンク内のブランドアイコン | リンクの色に従う（`currentColor`） |

本文リンクの下線は、位置（`text-underline-offset`）も太さ（`text-decoration-thickness`）も指定しない。
Inter が持つ推奨値（18px で太さ約 1.23px、ベースラインの約 3.1px 下）を使い、g / q などの
ディセンダーは下線を切って突き抜ける（`text-decoration-skip-ink: auto`）。

### まだない要素と、追加するときの色

要素がページに現れたときに、トークンと要素のスタイルを追加し、ライト / ダークで確認してから
この表を「要素と色」に移す。

| 要素 | 追加するトークン | Flexoki の役割 | ライト | ダーク |
| --- | --- | --- | --- | --- |
| `table` / `hr` / `blockquote` の罫線 | `--color-border`（追加済み） | `ui` | `base-100` | `base-900` |
| `code` / `pre` の背景 | `--color-bg-subtle` | `bg-2` | `base-50` | `base-950` |
| `mark` の背景 | `--color-highlight` | `highlight` | `yellow-100` | 未確認 |
| コードの構文の色 | なし | — | Shiki のテーマで付ける（Flexoki の VS Code テーマを使う想定。未検証） | |

注意:

- `--color-text-muted` を `--color-bg-subtle` の上に置くと、ライトで 4.47 になり AA を下回る
- `--color-text-muted` を `--color-tag-bg` の上に置くと 4.01 / 4.04 になり AA を下回る。タグの文字は `--color-tag-text`
- Flexoki 公式の `tx-3`（faint text）は読ませる文字に使わない。ライトの `base-300` は対 paper 2.00

### hover

**hover は強調を最大まで上げる。すでに最大なら変えない。** 合図は要素ごとに 1 つにする。

| 要素 | 通常 | hover |
| --- | --- | --- |
| nav の非アクティブ項目 | muted | `--color-text`（色だけ） |
| footer のアイコン | muted | `--color-text`（色だけ） |
| nav の現在地 | accent | 変えない（`nav a:not([aria-current='page']):hover` で除外する） |
| 本文リンク | accent + 下線 | 変えない（ブラウザ標準のポインタカーソルが合図になる） |

### 運用ルール

1. コンポーネントは semantic token（`--color-*`）だけを参照する。primitive（`--flexoki-*`）や色の値を直接書かない
2. 色を表現するために `opacity` を使わない。重ねる背景によって実際の色が変わり、測った比率が成り立たなくなる
3. 新しい文字色と背景色の組み合わせを作るときは、比率を一度計算して `global.css` の割り当ての隣にコメントで書く。
   AA（4.5:1）を目標にする。AA は努力目標で、自動テストは書かない（#23 の Lighthouse で確認する）

## 装飾

美意識としての方針。妥協・変更してよい。ミニマル志向の趣味的な選択であり、必要が生じたら見直す。

- `box-shadow` と `gradient` は使わない
- `border-radius` は 0。例外は形そのものが円である要素（モバイルの current マーカーのドット）
- 罫線は内容の区切りに必要な箇所だけに、細い線で引く（`table` / `hr` / `blockquote`、Work のエントリ間など）。
  レイアウトの構造を見せるための罫線は引かない。色は「色」の節の `--color-border`
- 一覧の項目を面（`bg-2`）や枠線で囲んでカードにしない。Flexoki の罫線は文章になじむ強さで、
  面の輪郭には薄く、`bg-2` の面は本文の中で浮く。項目の間に区切り線を引く（ADR-0024）
- 押せない領域に hover の変化を付けない。押せるように見えてしまう（ADR-0024）

### アセット

- **自作の** SVG はインクの外接矩形ちょうどで書き出す（viewBox に余白を含めない）。余白はレイアウト側で取る。
  アセットの余白をレイアウト側で打ち消すと、アセットを差し替えたときに補正値が嘘になる（ADR-0019）
- 外部のアイコンセット（Lucide、simple-icons）はそのまま使い、viewBox の余白を受け入れる。
  形を描き直さない（ADR-0023）
- ソーシャルアイコンは simple-icons の形をそのまま使う。形を描き直したもの（ピクセル版など）は使わない。
  ロゴの改変は各社のブランドガイドラインが最も強く禁じている（ADR-0019）
- 文字に並べるアイコン（↗、リンク内の GitHub マーク）は `display: inline` を指定する。
  Tailwind の Preflight が `svg` を `display: block` にするため（ADR-0023）
- ↗ は文字（U+2197）で書かない。Inter の latin サブセットに含まれず、矢印だけ Noto Sans JP で描かれる（ADR-0023）

## アニメーション

性能制約。原則として変更しない。

- **何を動かすか**で判断する。アニメーションの有無や見た目の派手さでは判断しない
- 動かしてよいプロパティ: `transform` / `opacity`（コンポジタで処理され、レイアウトも paint も
  起きない）、および `color` / `text-decoration-*` などレイアウトを伴わないもの
- 動かしてはいけないプロパティ: `width` / `height` / `top` / `left` / `margin` など
  レイアウトを誘発するもの（毎フレーム再レイアウトが走る）
- `scroll` イベントリスナーを書かない。追従 UI は `position: sticky`（CSS のみ、JS 不要）、
  出現・可視判定は `IntersectionObserver` を使う
- 時間は 150ms（UA 既定の 250ms より短く）。現在使っているのはページ遷移の view transition だけ
- hover の色の変化には `transition` を付けない（即時に切り替える）。hover の合図は色の変化
  1 つだけなので、それを遅らせない

## prefers-reduced-motion

アクセシビリティ制約。「アニメーション」の性能制約とは**別の話**。

- この設定が対象とするのは**位置やサイズが変わる動き**。前庭障害・片頭痛・てんかんの引き金に
  なるのはパララックス、ズーム、スライドイン、自動カルーセル、スクロール連動の移動といった
  変位である。機序は乗り物酔いと同じで、目が「動いている」と報告し内耳が報告しないという
  矛盾から不快感が生じる。数時間続く吐き気になり得るため、好みではなくアクセシビリティの問題
- `color` / `opacity` / `text-decoration-*` のホバーフィードバックは**対象外**。変位がない。
  MDN は dissolve（フェード）を動きの安全な代替手段として推奨しており、消す方が意図から外れる
- **動きを伴うアニメーションは `@media (prefers-reduced-motion: no-preference)` の中で宣言する**
  （opt-in）。`*` に `!important` で一括 opt-out する方式は採らない。理由は 2 つ:
  - `reduce` の利用者には宣言ごと適用されないため、打ち消しの書き忘れが構造的に起こらない
  - reveal 系で `opacity: 0` を常時適用すると、JS が失敗した場合にコンテンツが永久に見えない。
    opt-in なら初期状態が通常表示になる
- 例外: ページ遷移の view transition は opt-out にする。`@view-transition` は無条件に有効にし、
  `reduce` のときは `::view-transition-*(*)` の `animation` を `none` にする。view transition の
  目的は動きではなく、ページを作り直す途中の画面を隠すこと（iOS Chrome など）であり、
  `reduce` の利用者からもその効果を取り上げない。`view-transition-name` を付けた要素は
  ページ間で morph され位置が変わり得るが、`animation: none` は morph も止める（ADR-0016）
