# ADR-0016: ページ遷移は prefetch のみ — ClientRouter を採用しない

Date: 2026-09-06
Status: Accepted

## Context

SSG のまま、ページ遷移の体感速度を上げたい。選択肢は 3 つあった。

1. **prefetch 単体** — 遷移先を先読みする。フル reload は起きるが、HTML がキャッシュ済みのため
   ネットワーク待ちが消える
2. **`<ClientRouter />`**（`astro:transitions`）— フル reload を止めて client-side navigation 化する。
   prefetch を内包すると公式ドキュメントに記載がある
3. **ネイティブ cross-document view transitions**（CSS `@view-transition`）— JS なしで遷移アニメーション
   のみを提供する

検討開始時、当初の却下理由は「デザイン規約がアニメーションを禁じているから」だった。**この論拠は破棄した。**
規約のアニメーション禁止条項は「JS アニメーション = 重い」という誤解に由来しており、規約自体を先に
修正した（CLAUDE.md の Design Rules を「何を動かすか」で判定する形に改訂済み）。したがって、
実測でしか判断できない状態から始めた。

### 計測環境

- `pnpm build && pnpm preview`（本番ビルド）を localhost で配信
- Chrome DevTools / Network throttling `Fast 4G` / モバイルエミュレーション（376x562）
- HTTP キャッシュは有効なまま（全ドキュメントが 304 応答。再訪問者の条件に相当）
- 取得データ: HAR、Performance トレース、`PerformanceNavigationTiming` の記録スクリプト
- **限界**: CPU throttling は最終計測時に有効化できておらず、パース時間は実機下限寄りの値である

## Decision

- **prefetch のみを有効化する。**

  ```ts
  // astro.config.ts
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  ```

- **`<ClientRouter />` は採用しない。**
- **CSS `@view-transition` も宣言しない。**

`defaultStrategy: 'viewport'` は既定の `hover` からの意図的な変更である（理由は Rationale を参照）。

## Rationale

### ペイロード差は判断材料にならなかった

| | 配信される JS |
| --- | --- |
| 設定なし | 0 B |
| prefetch のみ | 2,488 B min / **1,137 B gzip**（実ビルド計測） |
| `<ClientRouter />` | 約 14,009 B min / **約 5,058 B gzip** |

差は gzip で約 4 KB。**この差では決まらない**と判断し、遷移そのものの実測に移った。

### 前進の遷移: prefetch は 0 リクエスト、ClientRouter は毎回ネットワーク

HAR での比較。

| | prefetch | ClientRouter |
| --- | --- | --- |
| 読み込み時の先読み | **3 件**（`VeryLow` 優先度、非ブロッキング） | **0 件** |
| クリック時のリクエスト | **0 件** | **1 件（毎回）** |
| その所要時間 | — | **195〜201 ms**（7 遷移とも一貫） |

prefetch 側は、クリックに対応するリクエストが HAR に 1 件も現れない。ナビゲーションが完全に
prefetch キャッシュから供給されている（`transferSize` も 66,515 B → 300 B に低下）。

### 戻る操作: bfcache と 360 ms

Performance トレースから、戻るボタン押下後の経過を再構成した（ClientRouter 側）。

| 経過 | イベント |
| --- | --- |
| 0 ms | 戻るボタン押下（`NavigationControllerImpl::GoToIndex`） |
| +31.5 ms | `astro:before-preparation` |
| +32.7 ms | `fetch('/')` 発行 |
| +231.1 ms | レスポンス受信（**ネットワーク 198 ms**） |
| +290.5 ms | `DOMContentLoaded`（**パース 48 ms**） |
| +345.8 ms | `astro:page-load`（**差し替え 55 ms**） |
| **+359.7 ms** | **スクリーンショット（画面反映）** |

トレースの `stackTrace` がこの fetch の発生源を `ClientRouter.astro_astro_type_script_index_0_lang.*.js`
と特定している（`priority: High` / `isLinkPreload: false`）。

prefetch 側では、同じ操作が **bfcache から復元**される（`pageshow` の `event.persisted === true` を実測で確認）。
ネットワークもパースも差し替えも発生しない。

さらに構造的な問題がある。**`<ClientRouter />` を入れると bfcache は原理的に使えなくなる。**
すべてのページ内遷移が `pushState` による同一ドキュメント遷移になり、ドキュメントが破棄されないため、
bfcache の出番が消える。

### ClientRouter の内蔵 prefetch は実質的に機能しない

公式ドキュメントは「`<ClientRouter />` を使うと prefetch がデフォルトで有効になる」と記載している。
**実測では機能しなかった**（7 遷移すべてで先読み 0 件）。原因はソースで確定した。

`node_modules/astro/components/ClientRouter.astro`:

```js
if (!__PREFETCH_DISABLED__) {
  init({ prefetchAll: true });   // defaultStrategy を渡していない
}
```

`node_modules/astro/dist/prefetch/index.js`:

```js
defaultStrategy ??= defaultOpts?.defaultStrategy ?? "hover";
```

`??=` は先勝ちのため、ClientRouter が `defaultStrategy` なしで `init` を呼ぶと `hover` に固定され、
`astro.config.ts` の設定で上書きできない。そして `hover` 戦略には **80 ms のデバウンス**がある。

```js
function handleHoverIn(href) {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => { prefetch(href); }, 80);
}
```

ホバーから 80 ms 以内にクリックすると先読みは開始すらしない。通常のクリック操作はこれより速い。

**この挙動は公式ドキュメントに記載がない。**

### `defaultStrategy: 'viewport'` を選ぶ理由

上記と同じ 80 ms デバウンスの問題は prefetch 単体でも起きる。初回の計測では既定の `hover` のままだったため
先読みが 1 件も発火せず、`transferSize` が 66,515 B のままだった。

本サイトの nav はサイドバー（デスクトップでは sticky、モバイルでは上部）にあり、**リンクは最初から
ビューポート内にある**。`viewport` 戦略なら読み込み直後にまとめて先読みされ、ホバーのタイミングに
依存しない。レイアウトの性質に合致した設定であり、計測用の小細工ではない。

### ネイティブ `@view-transition` を却下した理由

MDN 基準で Baseline 未達（limited availability）。prefetch 相当の Speculation Rules は Chromium 系のみで、
Astro の prefetch が持つ `fetch()` フォールバックがない。そして提供価値がアニメーションのみで、
それは本サイトが求めているものではない。

## Consequences

### Positive

- 遷移時のネットワーク待ちが消える。実装は設定 1 行で、コンポーネントの変更が不要。
- 戻る/進むが bfcache で処理され続ける。スクロール位置の復元、フォーカス管理、スクリーンリーダーへの
  遷移通知もブラウザの実装のまま残る。
- script のライフサイクル管理（`astro:page-load` での再初期化）という負債を負わない。今後 script を
  追加するとき、通常のページロードだけを考えればよい。
- Astro の prefetch は同一オリジンのリンクのみを対象とするため、footer の GitHub / LinkedIn リンクは
  `prefetchAll: true` でも対象外になる（`prefetch/index.js` の `location.origin === urlObj.origin` 判定）。
  低速回線・データセーバー時も自動的に抑制される。

### Negative

- **JS はゼロにならない。** prefetch は全ページに 1,137 B (gzip) のスクリプトを注入する。
  「ブラウザネイティブで足りる領域に JS を足さない」の完全な実現ではなく、
  「最小の JS で体感改善を取り、ライフサイクル管理は持ち込まない」という妥協である。
- 遷移アニメーションはない。フル reload は起きる（描画は起きるがネットワーク待ちはない）。
- **`prefetchAll: true` + `viewport` は投機的な通信である。** 現状は各ページ 197 KB（gzip 約 64.7 KB）
  のうち大半がフォント CSS であり、3 件の先読みだけで gzip 約 194 KB を投機的に転送している。
  リンク数が増えるとこのコストは線形に増える（下記「スケール時の再設定」を参照）。
- ページをまたいだ client-side state の共有はできない。必要になった時点で設計が必要になる。

## スケール時の再設定（Timeline / Writing のページ増加に備えて）

`prefetchAll: true` は「ビューポート内の内部リンクを全部先読みする」設定である。nav リンクが 3 件の
現状では妥当だが、**内部リンクが多いページが生まれた時点で見直しが必要**になる。

想定される分岐:

- `/writing` や `/timeline` が内部記事へのリンクを多数持つようになったら、`prefetchAll` を外し
  （`prefetch: true`）、nav リンクにだけ `data-astro-prefetch="viewport"` を付ける方式に切り替える。
  本文中のリンクは無指定（先読みしない）か `hover` に委ねる。
- Timeline の外部リンク（GitHub / Zenn）は同一オリジン判定で自動的に対象外なので、この問題には寄与しない。

**この判断は #105（193 KB のインライン `@font-face` CSS）と結合している。** 1 ページあたりの重量が
gzip 64.7 KB から数 KB に下がれば、先読みのコストはほぼ無視できるようになり、`prefetchAll` を
維持できる余地が広がる。逆に #105 を放置したままリンクが増えると、先読みが最初に破綻する。
**#105 を先に解決することを推奨する。**

## 再検討のトリガー

以下のいずれかが成立した時点で `<ClientRouter />` を再評価する。

- ページをまたいで保持したい client-side state が現れる（言語トグルの選択、Timeline のフィルタ条件など）
- 永続要素（遷移で中断させたくない UI）が必要になる
- Astro 側で ClientRouter の内蔵 prefetch に `defaultStrategy` を渡せるようになる、または
  `hover` のデバウンスが調整可能になる（今回の測定で ClientRouter が不利だった主因は
  ネットワーク 198 ms であり、これが消えれば結論が変わりうる）

ただし、仮に先読みが完全に機能したとしても、パース 48 ms + 差し替え 55 ms は残る。bfcache による
戻る操作より速くなる経路は現時点では見当たらない。

## Notes

- `<ClientRouter />` を有効にすると、FCP / LCP を前提とした計測ツールが壊れる。client-side navigation では
  対応する PerformanceEntry が生成されないためで、**DevTools 自身の Live metrics**（CDP 経由で web-vitals を
  注入している）が `Cannot read properties of undefined (reading 'startTime')` で例外を投げることを確認した。
  ブラウザの機能を自前実装に置き換えるコストの実例として記録しておく。
- Astro のトランジションイベント（`astro:before-preparation` / `astro:page-load` 等）は `document` に
  `bubbles: false` で dispatch される。`window` に登録したリスナーには届かない。

## References

- ADR-0015（デザインの CSS-first 方針）
- #105（193 KB のインライン `@font-face` CSS。本 ADR のスケール判断と結合している）
- https://docs.astro.build/en/guides/prefetch/
- https://docs.astro.build/en/guides/view-transitions/
