# Design Rules（ミニマル）

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

ライトの accent は Flexoki 公式の `cyan-600` ではなく `cyan-700`（600 は対 paper 4.43 で AA を下回る）。

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

本文リンクの下線は、位置（`text-underline-offset`）も太さ（`text-decoration-thickness`）も指定しない。
Inter が持つ推奨値（18px で太さ約 1.23px、ベースラインの約 3.1px 下）を使い、g / q などの
ディセンダーは下線を切って突き抜ける（`text-decoration-skip-ink: auto`）。

### まだない要素と、追加するときの色

要素がページに現れたときに、トークンと要素のスタイルを追加し、ライト / ダークで確認してから
この表を「要素と色」に移す。

| 要素 | 追加するトークン | Flexoki の役割 | ライト | ダーク |
| --- | --- | --- | --- | --- |
| `table` / `hr` / `blockquote` の罫線 | `--color-border` | `ui` | `base-100` | `base-900` |
| `code` / `pre` の背景 | `--color-bg-subtle` | `bg-2` | `base-50` | `base-950` |
| `mark` の背景 | `--color-highlight` | `highlight` | `yellow-100` | 未確認 |
| コードの構文の色 | なし | — | Shiki のテーマで付ける（Flexoki の VS Code テーマを使う想定。未検証） | |

注意:

- `--color-text-muted` を `--color-bg-subtle` の上に置くと、ライトで 4.47 になり AA を下回る
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

## その他

- フォント:
  - 英: Inter
  - 日: Noto Sans JP
  - 配信: Google Fonts でまとめて配信
  - フォントスタック例: `"Inter", "Noto Sans JP", system-ui, sans-serif`
- 罫線: 必要箇所のみ細い線。構造可視化のための装飾的な罫線は使わない。色は「色」の節を参照
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
- `prefers-reduced-motion`（アクセシビリティ制約。上記の性能制約とは**別の話**）:
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
  - ページ遷移の view transition は対象に含める。`view-transition-name` を付けた要素はページ間で
    morph されるため、`position: sticky` のサイドバーのように位置が変わり得る（ADR-0016 参照）
- レイアウト: 左寄せ、最大幅 65ch（本文）、行間は `--leading-body`（1.625）
- 文字サイズ: 本文 18px を基準、見出しは控えめな階層
- デザイントークンは `src/styles/global.css` の `:root` に集約（色の primitive だけは `src/styles/flexoki.css`）。コンポーネント側は `var(--color-text)` 等を参照し、値を直接書かない
