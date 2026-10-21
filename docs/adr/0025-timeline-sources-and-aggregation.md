# ADR-0025: Timeline のデータは、登録したソースをビルド時に 1 回だけ集約して作る

Date: 2026-10-21
Status: Accepted

## Context

ADR-0014 で Timeline を優先し、ソースと取得方式は別途決めるとしていた。Timeline は
`/`・`/en/`・`/timeline/` の 3 ページで使う（ADR-0017）。ソースは手書き・GitHub・Zenn で、
今後も増える見込みがある。外部のソースはいつでも落ちうるが、手書きのデータの誤りは
公開前に止めたい。

## Decision

### ソースは `TimelineSource` を配列に登録するだけで増える

```ts
interface TimelineSource {
  name: string;
  required: boolean;
  load(): Promise<TimelineEntry[]>;
}
```

`src/lib/timeline/index.ts` の `defaultSources` に足すだけで、ページとコンポーネントは変わらない。

### 失敗の扱いはソース自身が `required` で宣言する

| | 読み込みの失敗 | 壊れたエントリ |
| --- | --- | --- |
| `required: true`（手書き） | ビルドを止める（元のエラーを `cause` に残す） | ビルドを止める |
| `required: false`（外部） | 警告を出してそのソースを飛ばす | 警告を出してその 1 件を捨てる |

- 「壊れたエントリ」は 3 種類: `id` が `<ソース名>:` で始まらない、同じソース内で `id` が重複する、
  `date` が実在しない（`astro/zod` の `z.iso.date()`）
- `id` の接頭辞をソース名に縛るので、ソース間で `id` は衝突しない。重複の確認はソース内だけでよい
- 外部の API やフィードの応答は `unknown` で受け、zod で形を確かめてから使う
- 外部ソースが黙って 0 件や一部だけを返したら警告する（検索結果 0 件、ページの上限ちょうど、など）。
  失敗を飛ばす方針なので、取りこぼしはログでしか気づけない

### 集約はビルド全体で 1 回

ページは `getTimeline()` を呼ぶ。最初の呼び出しの Promise を保存し、2 回目以降は同じ Promise を
返す。3 ページが同じ結果を見るので、外部ソースの一時的な失敗でページごとに内容が食い違わない。
テストは毎回読み込む `loadTimeline(sources)` に偽のソースを渡して行う。

### ソースごとの取り方

| ソース | 取り方 | 載せるもの |
| --- | --- | --- |
| `manual` | `src/data/timeline.ts`（ADR-0022 の型付きモジュール） | データのない節目（資格・登壇など） |
| `github-repo` | REST `/users/<user>/repos` | topic `showcase` を付けた、公開・非フォーク・非アーカイブのリポジトリの作成日 |
| `github-contribution` | Search API `author:<user> -user:<user> is:public` | 他人のリポジトリへの Issue と、マージ済み・オープン中の PR（マージせず閉じた PR は除く） |
| `github-stats` | GraphQL `contributionsCollection`、暦年ごとのエイリアスを 1 リクエストで | 締まった月ごとの contributions 数（非公開分の件数を含む）。0 件の月と今月は除く |
| `zenn` | RSS（`https://zenn.dev/<user>/feed`）を `@rgrove/parse-xml` で読む | 記事 |

- 日付はすべて日本時間（`Asia/Tokyo`）の暦日にする。API とフィードは UTC / GMT で返す
- topic は、技術を表す topic と取り違えて付けないよう、意図した選別の語（`showcase`）にする
- 非公開リポジトリは、クエリ（`is:public`）とコード（`!repo.private`）の両方で除く。
  将来トークンの権限を広げても公開サイトに漏れないため
- GitHub の認証は `process.env.GITHUB_TOKEN`。無ければ REST は未認証で呼び、GraphQL は通信前に失敗させる
- 設定値（ユーザー名・topic・統計の開始月）は `src/config/site.ts` の `timeline` に置く

## Rationale

### 却下した案: Astro の Content Layer に独自 loader を書く

ビルドの最初に 1 回だけ実行される点は同じだが、集約・ソート・失敗の扱いは結局自分で書く。
ページが読む `getCollection` は仮想モジュールで、素の Vitest からは呼べない。
「1 回だけ」はメモ化の数行で得られ、テストしやすさを手放す理由にならなかった。

### 却下した案: GitHub の events API / Atom フィード

直近約 90 日しか返さず、push のたびにエントリが増える。古い貢献が Timeline から消えていく。
リポジトリ一覧と Search API は期間の制限がない。

### 却下した案: Zenn の JSON API

解析は不要になるが非公式で、仕様が変わるとエラーにならず記事が黙って消える。RSS は Zenn が
利用者向けに提供している。XML は CDATA を含むので正規表現では読まず、パーサを使う。
`fast-xml-parser` は依存を 7 つ連れてくるうえ、要素の数で型が変わる（0 件 / 1 件 / 複数）。
`@rgrove/parse-xml` は依存が無く、子要素が常に配列なので選んだ。

## Consequences

- CI のビルドに `GITHUB_TOKEN` を渡さないと、統計が出ない。Actions の `GITHUB_TOKEN` で他ユーザーの
  `contributionsCollection` を引けるか、非公開分の件数が見えるかは CI で確認する。引けなければ
  読み取り専用の fine-grained PAT を secret にする
- 統計の非公開分は、プロフィールの「Include private contributions」が有効な間だけ見える
- 外部ソースの鮮度は日次リビルド（ADR-0014）に依存する
- Zenn の RSS が直近の何件まで返すかは未確認。上限があれば、記事が増えると古い記事が消える
- `/writing`（ADR-0012）を作るときは、Zenn のソースをそのまま使える

## Related

- ADR-0012: ブログ記事は外部リポ / Zenn で管理する
- ADR-0014: Timeline を優先し `/writing` を保留（本 ADR でソースと取得方式を決める）
- ADR-0017: Timeline はダイジェスト + 全件ページ
- ADR-0022: 手書きデータは型付きの TS モジュールに置く
- ADR-0026: Timeline をコミットグラフとして描く
- #94 / #95 / #96
