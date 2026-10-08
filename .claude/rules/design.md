# Design Rules（ミニマル）

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
- ダークモード: `@media (prefers-color-scheme: dark)` で CSS 変数を上書き。JSなし、ユーザートグル UI なし
- デザイントークンは `src/styles/global.css` の `:root` に集約。コンポーネント側は `var(--foreground)` 等を参照し、色の直値を書かない
