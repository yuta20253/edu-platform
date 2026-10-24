# 第1周の対応(元の草案「EditGoal / EditTask / Calendar / CreateTaskConfirm」への批判)

第1周の判定: **直せば進めてよい**(4画面を分割する前提)

この批判は、4画面をまとめた元の草案に対するもの。対応として草案を分割し、このフォルダの `draft.md` は **CreateTaskConfirm 単独のチケット**に書き換えた。EditGoal / EditTask は `2026-10-23_student_edit_goal_task_after_errorstatus/` の新しい草案にした。

| 指摘 | 重大度 | 対応 | 理由・草案のどこを直したか |
| --- | --- | --- | --- |
| 1. 価値の中心は CreateTaskConfirm の不具合修正で、TSK-219 待ちの EditGoal / EditTask に引きずられる。分けるべき | 重要 | 採用 | 2つの草案に分けた。CreateTaskConfirm は単独、EditGoal / EditTask は TSK-219 のマージ後(Backlog)。案 E「元の草案どおり」を不採用として比較表に残した |
| 2. `NaN` の `draftTaskId` を取得して失敗させるのは雑。不正入力と障害を区別できず、再試行しても直らない画面に「再試行」が出る | 重要 | 採用 | `page.tsx` で `Number.isInteger(n) && n > 0` を確かめ、不正なら `notFound()` にする設計に変えた(admin に先例がある)。`useApiQuery` の拡張は不要。案 A「NaN を取得して失敗させる」を不採用にした。バックエンドが返すステータスを確かめる未検証の前提は不要になった |
| 3. Calendar の `AsyncBoundary` 化は、取得状態ではないもの(ハイドレーション待ち)の流用で、価値も無い | 重要 | 採用 | Calendar は対象から外した。理由を「Calendar を対象外にする理由」に書いた。許可リストに載せるか走査テストで除外するかは TSK-216 で決める(オーナーに聞く) |
| 4. CreateTaskConfirm の合成設計に、決めるべき点が残っている | 重要 | 採用 | 設計に明記した: `data` は `goal && draftTask ? { goal, draftTask } : null`、`error` は `goalError \|\| draftTaskError`、内側の `CreateTaskConfirmBody` に分ける(`QuestionBody` が先例)、`fallback` は既定のスピナー(`card-skeleton` は案 C として不採用)、片方失敗の再試行は両方を取り直す |
| 5. テストの罠(既存テストは回帰防止、片方失敗は URL 分岐のモック、実画面の確認、401) | 重要 | 採用 | 「やること」を Red と回帰防止に分けた。片方失敗・再試行は URL と呼び出し回数で分岐するモックを使うと書いた。401 は Red(現行は `/login` に遷移しない)。実画面の確認を完了条件に足した |
| 6. 完了条件が測りにくい | 軽微 | 採用 | 「`index.tsx` に `CircularProgress` の import が無い」を条件にした。許可リストは TSK-216 が未マージなら外す旨をコメントする、に直した。「不正な ID で 404」も入れた |
| 7. EditGoal / EditTask のメリットを正直に書く | 軽微 | 採用 | 新しい草案に「見た目の一貫性とコード削減が中心で、機能面の効果はほとんど無い」と書いた。404 でも再試行が出る点、`fallback` で高さを保つ案(案 D)も書いた |

## 本人に確認すべき問い(手順5で聞く)

1. Calendar を対象外にして、TSK-216 側(許可リスト、または走査テストでの除外)で扱うことでよいか。
2. EditGoal / EditTask は、利用者への効果がほぼ無いまま、TSK-219 のあとに Backlog として起票してよいか。それとも起票しないか。
3. CreateTaskConfirm の不正 ID は `notFound()` でよいか(`ErrorState` ではなく)。
4. 実画面での失敗再現(ネットワーク遮断、`draft_task_id` なし)に、開発サーバーを使ってよいか。
