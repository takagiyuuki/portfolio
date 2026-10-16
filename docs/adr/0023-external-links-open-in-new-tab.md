# ADR-0023: 外部リンクは新しいタブで開き、そのことを見た目と読み上げの両方で知らせる

Date: 2026-10-16
Status: Accepted

## Context

Work ページ（#19）で、本文中に外部サイトへのリンク（ライブサイト、GitHub、記事）が初めて
並んだ。それまで外部リンクは footer の GitHub / LinkedIn アイコンだけで、
`target="_blank" rel="noopener noreferrer"` で新しいタブを開き、そのことを知らせていなかった。

本文中のリンクは、CSS の見た目だけではサイト内へのリンクか外部へのリンクかを区別できない。

## Decision

### 外部リンクは新しいタブで開く

`target="_blank"` を付ける。`rel` は **`noopener` だけ**を付け、`noreferrer` は付けない。

- `noopener` は現行ブラウザでは `target="_blank"` だけで暗黙に適用される。明示するのは、
  Biome の `lint/security/noBlankTarget` がこれを要求することと、古いブラウザへの保険のため
- `noreferrer` を付けないのは、リンク先（GitHub の Traffic、Zenn の解析）で yukit.dev から
  の流入を確認できるようにするため。`noopener` は Referer の送信に影響しない

### 新しいタブで開くことを知らせる

| リンクの種類 | 見た目 | 読み上げ |
| --- | --- | --- |
| 本文中のテキストリンク | テキストの後ろに ↗ | 視覚的に隠したテキスト " (opens in new tab)" をリンクの中に置く |
| アイコンだけのリンク（footer） | 何も足さない | `aria-label` に "(opens in new tab)" を含める（#135） |

- 本文中のテキストリンクは `src/components/ExternalLink.astro` で書く。↗ は `aria-hidden`
  にし、隠しテキストの CSS はコンポーネントのスコープに閉じる（ADR-0015 は utility class
  を使わない）
- アイコンだけのリンクに ↗ を付けないのは、footer のソーシャルアイコンが新しいタブで
  開くことが、多くのサイトで共有された慣習になっているため

### ↗ はアイコンセットの SVG を使う

↗ は文字（U+2197）ではなく、`@iconify-json/lucide` の `lucide:arrow-up-right` を
astro-icon で埋め込む。

- Inter の latin サブセットに U+2197 は含まれていない。文字で書くと、矢印だけが
  Noto Sans JP の CJK スライスから描かれ、字形が揃わず、スライスの取得も 1 本増える
- 外部のアイコンセットは**そのまま使い、viewBox の余白を受け入れる**。ADR-0019 の
  「アセットは余白なしで書き出す」は自作のアセットに適用する規則とする。外部の
  アイコンの形を描き直さないという点で、ADR-0019 のソーシャルアイコンの扱いと揃う
- Tailwind の Preflight は `svg` を `display: block` にするので、文中のアイコンは
  `display: inline` で上書きする

## Rationale

### なぜ新しいタブか

WCAG で新しいタブを開くことを扱うのは SC 3.2.5（AAA）で、事前の告知（G201）は
Advisory である。同じタブで開く方が閲覧者に選択を委ねられる（中クリックや
Cmd/Ctrl+クリック）が、個人のポートフォリオでは外部リンクを新しいタブで開く慣習が
定着している。慣習に従い、その代わりに告知を必ず付けることで G201 の懸念
（予告なく新しいタブが開くと、視覚情報を得にくい人や一部の認知障害のある人が混乱する）に
応える。

### 却下した案: 同じタブで開く

閲覧者の選択を奪わず、告知も要らない。しかし footer（新しいタブ）と本文（同じタブ）で
挙動が分かれ、慣習からも外れる。

## Consequences

- 外部リンクを本文に書くときは、`<a>` を直接書かずに `ExternalLink` を使う。Timeline の
  外部リンクも対象になる
- footer の `rel` と `aria-label` は #135 で揃える。それまでは footer だけ
  `noreferrer` が付き、告知がない
- `.claude/rules/design.md` のアセットの規則に、外部アイコンセットの扱いを追記する
- 依存に `@iconify-json/lucide`（devDependency）が加わる。ビルド時に使うアイコンだけが
  HTML に埋め込まれるので、配信量は増えない

## Related

- ADR-0015: CSS-first — utility class を使わない
- ADR-0019: chrome の書体。アセットの余白とソーシャルアイコンの扱い
- [G201: Giving users advanced warning when opening a new window](https://www.w3.org/WAI/WCAG22/Techniques/general/G201)
- [Understanding SC 3.2.5: Change on Request](https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html)
- #135: footer のアイコンリンクに「新しいタブで開く」告知を追加する
