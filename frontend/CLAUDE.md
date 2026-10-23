# frontend 開発ルール

frontend(Next.js)の実装・レビュー時に守るルール。

## データ取得画面の表示規約(ローディング・エラー)

`features/**/index.tsx` など、データを取得して表示する画面は次の規約に従う。実装時とレビュー時の基準とする。

1. **分岐の順序**: エラーがあればエラー表示 → データ取得中はローディング → 成功の順に判定する。
2. **`loading` フラグの初期値に依存しない**: 「data がなく、error もない」状態をローディングとみなす。`loading` の初期値が `false` だと初回にエラー表示が一瞬出る。
3. **再取得中は前回の data を残す**: ページ・絞り込み・タブの切替で `data` を `null` に戻さない(画面全体がスピナーに置き換わらないようにする)。
4. **エラー表示は `ErrorState` を使う**: 再試行できるように `onRetry` を渡す。`401` は `/login` に遷移し、エラー表示にしない。文言を直書きしない。
5. **ローディング表示は画面の種類ごとに1つに決める**: 一覧・詳細・ダッシュボードごとに統一する。割り当ては次の表のとおり(案。`AsyncBoundary` の PR レビューで確定する)。

   | 画面の種類                     | 表示                        | `AsyncBoundary` の `fallback` |
   | ------------------------------ | --------------------------- | ----------------------------- |
   | 一覧(テーブル)                 | スケルトン(`TableSkeleton`) | `"table-skeleton"`            |
   | 一覧(カード)                   | スケルトン(`CardSkeleton`)  | `"card-skeleton"`             |
   | 詳細・フォーム・ダッシュボード | スピナー                    | `"spinner"`(デフォルト)       |

   `AsyncBoundary`(`components/ui/AsyncBoundary.tsx`)は、上記の規約1〜4の分岐(エラー → ローディング → 成功)をまとめた共通コンポーネント。既存画面の移行は別チケットで行う。

### 良い例

```tsx
// hooks/useGetItems.ts: loading フラグを持たず、data と error だけを返す
export const useGetItems = () => {
  const [data, setData] = useState<ItemsData | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    setError(false); // 再取得中も data は消さない(規約3)

    apiClient
      .get<ItemsData>("/api/items", { signal: controller.signal })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) {
          router.push("/login"); // 401 はエラー表示にしない(規約4)
          return;
        }
        setError(true);
      });

    return () => controller.abort();
  }, [reloadKey, router]);

  return { data, error, retry: () => setReloadKey((k) => k + 1) };
};

// index.tsx: エラー → ローディング → 成功の順(規約1, 2)
export const Items = () => {
  const { data, error, retry } = useGetItems();

  if (error) return <ErrorState onRetry={retry} />;
  if (!data) return <CircularProgress />; // data も error もない状態 = ローディング
  return <Presenter data={data} />;
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
