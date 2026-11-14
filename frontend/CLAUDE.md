# frontend 開発ルール

frontend(Next.js)の実装・レビュー時に守るルール。

## データ取得画面の表示規約(ローディング・エラー)

`features/**/index.tsx` など、データを取得して表示する画面は次の規約に従う。実装時とレビュー時の基準とする。

1. **分岐の順序**: エラーがあればエラー表示 → データ取得中はローディング → 成功の順に判定する。
2. **`loading` フラグの初期値に依存しない**: 「data がなく、error もない」状態をローディングとみなす。`loading` の初期値が `false` だと初回にエラー表示が一瞬出る。
3. **再取得中は前回の data を残す**: ページ・絞り込み・タブの切替で `data` を `null` に戻さない(画面全体がスピナーに置き換わらないようにする)。
4. **エラー表示は `ErrorState` を使う**: 再試行できるように `onRetry` を渡す。`401` は `/login` に遷移し、エラー表示にしない。`Alert` などで失敗表示を手書きしない(具体的な文言は `AsyncBoundary` の `errorMessage` や `ErrorState` の `message` に渡す)。
5. **ローディング表示は画面の種類ごとに1つに決める**: 一覧・詳細・ダッシュボードごとに統一する。割り当ては次の表のとおり。

   | 画面の種類                     | 表示                        | `AsyncBoundary` の `fallback` |
   | ------------------------------ | --------------------------- | ----------------------------- |
   | 一覧(テーブル)                 | スケルトン(`TableSkeleton`) | `"table-skeleton"`            |
   | 一覧(カード)                   | スケルトン(`CardSkeleton`)  | `"card-skeleton"`             |
   | 詳細・フォーム・ダッシュボード | スピナー                    | `"spinner"`(デフォルト)       |

   `AsyncBoundary`(`components/ui/AsyncBoundary.tsx`)は、上記の規約1〜4の分岐(エラー → ローディング → 成功)をまとめた共通コンポーネント。データ取得画面の移行は完了していて、手書きの表示が残る画面は無い(例外は下の「例外の扱い」の恒久のものだけ)。

   **例外(ヘッダーを残したまま中身だけエラーにする画面)**: [`features/teacher/StudentDetail`](features/teacher/StudentDetail/index.tsx) は、最初の取得とその失敗だけ `AsyncBoundary` で画面全体に出す(`error={!data && error}`)。タブ切り替え後の失敗は、生徒名のヘッダーを残すため Presenter の中で `ErrorState`(再試行つき)を出す。`AsyncBoundary` に `data` があるときの `error` を渡すと、ヘッダーごとエラー表示に置き換わるので渡さない。

### 共通部品

| 部品                             | 場所                              | 使いどころ                                                                                                                                                 |
| -------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AsyncBoundary`                  | `components/ui/AsyncBoundary.tsx` | エラー → ローディング → 成功の分岐をまとめる。`fallback` でローディング表示を選ぶ(規約5)                                                                   |
| `ErrorState`                     | `components/ui/ErrorState.tsx`    | エラー表示(`message`、`onRetry`)。`AsyncBoundary` が内部で使う。画面の一部の失敗表示にも使える                                                             |
| `CardSkeleton` / `TableSkeleton` | `components/ui/`                  | スケルトン。`AsyncBoundary` の `fallback` から使う                                                                                                         |
| `useApiQuery`                    | `hooks/useApiQuery.ts`            | GET の取得。`data`・`error`・`errorStatus`・`refetch` を返す。`loading` フラグは持たない(規約2)。再取得中も `data` を残す(規約3)。`401` は `/login`(規約4) |

### 良い例

```tsx
// index.tsx: useApiQuery が取得状態を持ち、AsyncBoundary がエラー → ローディング → 成功の分岐をまとめる
export const Items = () => {
  const { data, error, errorStatus, refetch } =
    useApiQuery<ItemsData>("/api/items");

  return (
    <AsyncBoundary
      data={data}
      error={error}
      // 具体的な文言は属性で渡す(404 だけ出し分ける例)
      errorMessage={
        errorStatus === 404
          ? "アイテムが見つかりませんでした"
          : "アイテムの取得に失敗しました"
      }
      onRetry={refetch}
    >
      {(items) => <Presenter data={items} />}
    </AsyncBoundary>
  );
};
```

実装の参考: [`features/student/Tasks`](features/student/Tasks/index.tsx)(`AsyncBoundary` + `useApiQuery`。分岐の順序・`data` の保持・再試行)

### 悪い例

```tsx
// features/teacher/Dashboard/index.tsx(抜粋)
const [data, setData] = useState<DashboardData | null>(null);

useEffect(() => {
  apiClient
    .get<DashboardData>("/api/teacher/dashboard")
    .then((res) => setData(res.data))
    .catch((err) => {
      if (err.response?.status === 401) router.push("/login");
      // 401 以外のエラーを握りつぶしている
    });
}, [router]);

if (!data) return <CircularProgress />; // 失敗してもスピナーのまま止まらない
```

- 401 以外で取得に失敗すると、エラーが表示されず**無限にスピナーが回る**(規約4に違反)
- `loading` の初期値を `false` にして `if (!loading && !data) return <ErrorState />` とすると、初回描画で一瞬エラーが出る(規約2に違反)
- `"データの取得に失敗しました"` を画面ごとに直書きすると、文言や見た目がずれる(規約4に違反。`ErrorState` の初期値を使う)

この悪い例のうち、`index.tsx` での `CircularProgress` の import と失敗文言の直書きは、`npm run lint` が検出する(次の節)。

### ルールの強制(ESLint)

`eslint.config.mjs` のルールで、次を `npm run lint`(CI でも実行)が検出する。ルール自体は `lint/displayRules.test.ts` でテストしている。

- `features/**/index.tsx` で `CircularProgress` を import する(`@mui/material` の名前付き import と、`@mui/material/CircularProgress` の個別 import の両方)。送信ボタンの「処理中」スピナーなど、`index.tsx` 以外での使用は対象外
- `features/**/index.tsx` で、名前が `loading` で終わる変数(`loading`・`isLoading`・`teacherLoading` など。`state.loading` のようなメンバー参照も)を条件にした分岐(`if`・三項演算子・`&&`)を書く。`<Presenter loading={loading} />` のように props として渡すだけなら対象外
- `features/**/*.tsx`(テストを除く)の JSX のテキストに「取得に失敗」を書く、または「データの取得に失敗しました」をリテラルで書く。`errorMessage` や `message` の属性に具体的な文言を渡すのは**許可**(採用済みのパターン)

次は機械では検出できないので、**レビューで確認する**。

- `!data` 単独の分岐(`if (!user) redirect(...)` のような正当な使い方と区別できない)
- 401 以外のエラーを `.catch` で握りつぶすこと
- 手書きの取得フック。新しい取得は `useApiQuery` を使い、`apiClient.get` を直接呼ばない(`git grep "apiClient.get"` で確かめる)。`.ts` のフックに `setError("…取得に失敗しました")` と書く経路も同じ
- ローディング・エラーの分岐を `index.tsx` から `Presenter` へ移すこと
- 失敗文言を、式の中のリテラル(`{"…取得に失敗…"}`)・テンプレートリテラル・変数で書くこと(JSX のテキストのルールは見逃す)
- 名前に `loading` を含まない変数(`pending` など)での手書きの分岐

### 例外の扱い

やむを得ない例外は、違反の行の直前に、ルール名と理由つきの `eslint-disable-next-line` を付ける。**理由は固定の見出しで始める**。

- 恒久: `表示規約の例外(恒久): <理由>`
- 一時: `表示規約の例外(一時): <チケット番号> で移行予定`

**例外を足してよい基準**: 恒久は、理由が取得状態ではないこと(ハイドレーション待ち・初期選択の待ちなど)。一時は、移行チケットの番号があること。

置き場所は、違反が報告される行の直前。JSX のテキストの違反は、文言の行ではなく、JSX テキストの開始行(開始タグを閉じる `>` の行)で報告される。

- 単行の開始タグ: 開始タグの行の直前に `{/* eslint-disable-next-line no-restricted-syntax -- 表示規約の例外(一時): TSK-231 で移行予定 */}`(実例: `lint/displayRules.test.ts` の「単行の開始タグ」のテスト。`TSK-231 で移行予定` は見本の文字列で、実際の移行チケットではない)
- 複数行の開始タグや三項演算子の中: タグの中の最後の属性の次の行(`>` の直前)に `// eslint-disable-next-line no-restricted-syntax -- …`。三項演算子の中では `{/* */}` は効かない(実例: `lint/displayRules.test.ts` の「複数行の開始タグ + 三項演算子」のテスト)

違反を直したら、その行の `eslint-disable` も消す。消さないと `npm run lint` が落ちる(不要になった disable を検出する設定のため。作業中のブランチは、main を取り込んだあとに落ちることがある)。

例外の一覧は、次で出す(一覧を手で保守しない)。

```bash
grep -rn "表示規約の例外" frontend/features
# 一時の例外だけ
grep -rn "表示規約の例外(一時)" frontend/features
# 見出しの付いていない例外が無いこと(結果が空であること)
grep -rn "eslint-disable.*no-restricted" frontend/features | grep -v 表示規約の例外
```

**現在の一時の例外**: なし(`CreateStudent` と `StudentDetail` は TSK-231 で移行した)。

### 実装・レビュー時の確認項目

- [ ] 取得に失敗したときに、エラー表示と再試行ができる(`AsyncBoundary` の `onRetry` / `ErrorState`)
- [ ] 初回表示でエラー表示やちらつきが出ない(規約2)
- [ ] 再取得中に前回の内容が消えない(規約3)
- [ ] 新しい取得は `useApiQuery` を使い、`apiClient.get` を直接呼んでいない
- [ ] 上の「ルールの強制」の、機械で守るルールとレビューで守るルールのどれにも、新しく違反していない
- [ ] 例外を足した場合は、固定の見出し・基準(恒久は理由、一時はチケット番号)を満たし、見出しの付いていない例外の `grep`(上)が空である
