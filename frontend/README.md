This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## データ取得画面の表示規約(ローディング・エラー)

`features/**/index.tsx` など、データを取得して表示する画面は次の規約に従う。レビューの基準もこの規約とする。

1. **分岐の順序**: エラーがあればエラー表示 → データ取得中はローディング → 成功の順に判定する。
2. **`loading` フラグの初期値に依存しない**: 「data がなく、error もない」状態をローディングとみなす。`loading` の初期値が `false` だと初回にエラー表示が一瞬出る。
3. **再取得中は前回の data を残す**: ページ・絞り込み・タブの切替で `data` を `null` に戻さない(画面全体がスピナーに置き換わらないようにする)。
4. **エラー表示は `ErrorState` を使う**: 再試行できるように `onRetry` を渡す。`401` は `/login` に遷移し、エラー表示にしない。文言を直書きしない。
5. **ローディング表示は画面の種類ごとに1つに決める**: 一覧・詳細・ダッシュボードごとに統一する。割り当ては `AsyncBoundary` 追加のチケットで確定するため、それまでは近い画面の既存実装に合わせる。

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

実装の参考: [`features/student/Interviews`](features/student/Interviews/index.tsx)(分岐の順序・`data` の保持。再試行は未対応)

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

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
