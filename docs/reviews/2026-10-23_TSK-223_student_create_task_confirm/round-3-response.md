# 第3周の対応(CreateTaskConfirm)

第3周の判定: **このまま進めてよい**

| 指摘 | 重大度 | 対応 | 理由・草案のどこを直したか |
| --- | --- | --- | --- |
| 1. 同じエンドポイントを2経路で取得する(残る `useFetchDraftTask` は置き場違い) | 軽微 | 採用 | 「その他」に、「`CreateTask` を `useApiQuery` に移すときに `useFetchDraftTask.ts` を削除する。それまでは URL が2か所にある」を足した |
| 2. `page.tsx` の `searchParams` の型と `isNumericId` の引数の型が合わない | 軽微 | 採用 | 「やること」に、実装時に `searchParams` の型を `string | string[] | undefined` に直すこと、`notFound` のモックの扱いを書いた |
| 3. 完了条件のうち「直書きが無い」が測りにくい | 軽微 | 採用 | `grep` で確かめられる形(`CircularProgress`・`Backdrop` の import が無い、`console.error` による握りつぶしが無い、`useFetchDraftTask` を import していない)にした |

## 本人に確認すべき問い(手順5で聞く)

1. `CreateTask` の黙殺を、別チケットとして起票するか(推奨: する)。
2. Calendar を対象外にして、TSK-216 側で扱うことでよいか。
3. 不正 ID は 404(`notFound()`)でよいか。
4. 実画面確認(新規タスク作成 → 確認 → 登録の通し、`draft_task_id` なし)を行うか。
