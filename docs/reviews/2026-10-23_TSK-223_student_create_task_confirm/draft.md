## 概要

`features/student/CreateTaskConfirm`(タスク作成の確認画面)で、目標と下書きタスクの取得に失敗しても何も表示されない問題を直す。取得を `useApiQuery`、表示を `AsyncBoundary` に置き換え、失敗時にエラー表示と再試行を出す。あわせて、不正な ID(`goalId` や `draft_task_id` が数値でない)でページを開いたときは、404 にする。

TSK-215 の対象一覧(「など」)に入っておらず、あとから見つかった画面のうち、**不具合の修正として価値が高いもの**を単独のチケットにした(元は EditGoal / EditTask / Calendar と1つの草案だったが、レビューで分けた)。

## 背景(調査結果)

- 目標の取得(`useFetchGoal`)と下書きタスクの取得(`useFetchDraftTask`)は、どちらも失敗すると `console.error` するだけで、画面には何も出ない。
- 失敗すると、確認画面の各項目(目標のタイトル、タスクの内容など)が**空欄のまま**表示される。「登録する」を押しても、`if (!draftTask) return` で何も起きない。生徒には、押しても反応しない理由が分からない。
- 401(ログイン切れ)でも `/login` に遷移しない。
- ローディングは、下書きタスクの取得中だけ全画面の `Backdrop` とスピナーを出す(中身は空欄のまま後ろに見える)。目標の取得中は何も出ない。
- **隣の `CreateTask`(タスク作成画面)も、同じ `useFetchDraftTask` を使っており、同じ黙殺がある。** このチケットでは `CreateTask` は変えない(別件。下の「その他」)。
- `page.tsx` は `Number(goalId)` と `Number(draft_task_id)` をそのまま渡す。`draft_task_id` が無いと `NaN` になり、現行のフックは `if (!draftTaskId) return` で取得せず、空欄の画面だけが出る。

### 検証済みの前提

| 前提 | 確かめ方 | 結果 |
| --- | --- | --- |
| 取得失敗が画面に出ない | `useFetchGoal.ts` / `useFetchDraftTask.ts` を読む | `catch` で `console.error` のみ |
| 失敗すると項目が空欄のまま、登録は何も起きない | `index.tsx` を読む | `goal?.title` などの空欄表示。`if (!draftTask) return` |
| 401 でログイン画面に遷移しない | 同上 | `router` を使っていない |
| `draft_task_id` が無いと `NaN` になる | `confirm/page.tsx` を読む | `Number(draft_task_id)` |
| 既存の `index.test.tsx` は `apiClient.get` を URL で分岐する `mockImplementation` で、取得失敗のテストが無い | `index.test.tsx` を読む | 表示・登録・失敗・キャンセルの4件。取得失敗は無い |
| 不正な ID を 404 にする書き方が、すでにある | `grep notFound app`、`libs/server/routeParams.ts` | admin の `notices/[noticeId]/edit/page.tsx` が、`isNumericId`(`/^\d+$/`)で文字列のまま検証し、不正なら `notFound()` を呼んでいる |
| `useFetchDraftTask`(と `DraftTaskType`)は `CreateTask` からも使われている | `grep -rn "useFetchDraftTask\|DraftTaskType" frontend` | `CreateTask/index.tsx` が `useFetchDraftTask` を import。`DraftTaskType` は4か所(`CreateTaskConfirm/hooks.ts`・`hooks.test.ts`、`CreateTask/hooks/useDefaultValues.ts`・`.test.ts`)から使われている |
| `types.ts` に、同名で形の違う `UnitType` / `CourseType` がある | `types.ts` を読む | `useFetchDraftTask.ts` のローカル型(`course` つきの `UnitType` など)とは別物。そのまま移すと衝突する |
| `useApiQuery` は 401 を `/login` に遷移し、エラーにしない | `hooks/useApiQuery.ts` を読む | そのとおり |

### 未検証の前提

| 前提 | 確かめる方法 |
| --- | --- |
| 実画面で「新規タスク作成 → 確認 → 登録」の遷移が、変更後も変わらない | 実画面で確かめる(開発サーバーと生徒アカウントが要るので、オーナーの了承を得てから) |
| 取得失敗の再現(ネットワーク遮断)で、エラー表示と再試行が出る | 同上。DevTools のネットワーク遮断で再現する |
| 片方の取得だけが成功したとき、再試行で成功した側が一瞬スピナーに戻らない | `useApiQuery` は再取得中も data を残す(コードで確認)ので戻らない見込み。単体テストで確かめる |

## 設計

### page.tsx

- `goalId` と `draft_task_id` を、**既存の `isNumericId`**(`libs/server/routeParams.ts`。`/^\d+$/` で文字列のまま検証する。admin の `page.tsx` と同じ書き方)で確かめ、不正なら `notFound()` を呼ぶ。`draft_task_id` が無い(`undefined`)ときや、配列(`searchParams` に同じキーが繰り返されたとき)も不合格にする。`"0"` は `isNumericId` を通るが、ID は 1 から始まるので、`Number(x) > 0` も併せて確かめて 404 にする。
- 不正な ID で、意味のないリクエストを飛ばさない。

### index.tsx

- `CreateTaskConfirm`(外側)は、`useApiQuery` を2つ呼び(目標、下書きタスク)、`AsyncBoundary` で包む。
  - `data` は `goal && draftTask ? { goal, draftTask } : null`、`error` は `goalError || draftTaskError`、`onRetry` は両方の `refetch`。
  - 両方が揃ってから、内側の `CreateTaskConfirmBody` を描画する(直近の `QuestionBody` と同じ分け方)。`useRegisterTask`・`snackbar` の state・`handleRegister` は内側に置く。取得前の `draftTask` が `null` の分岐が、そもそも無くなる。
  - 一度成功した側の再取得が失敗した場合も、`error` が立つので、確認画面は消えてエラー表示になる(許容する)。
  - `fallback` は既定のスピナー(規約5「詳細・フォーム・ダッシュボード = スピナー」)。
- 片方だけ失敗したときも、`AsyncBoundary` のエラー表示にして、再試行で両方を取り直す。成功した側は `useApiQuery` が再取得中も data を残すので、一瞬スピナーに戻らない見込み(単体テストで確かめる)。
- 全画面の `Backdrop`・`CircularProgress` と、**`CreateTaskConfirm/useFetchGoal.ts`(とそのテスト)だけ**を削除する(`EditGoal/hooks/useFetchGoal.ts` は別物なので触らない)。
- **`useFetchDraftTask.ts` は削除しない**(`CreateTask` が使っているため)。`CreateTaskConfirm` は使わなくなる。`CreateTask` の黙殺は別件にする(案 F)。
- `DraftTaskType` は `types.ts` に移し、4か所の import(`CreateTaskConfirm/hooks.ts`・`hooks.test.ts`、`CreateTask/hooks/useDefaultValues.ts`・`.test.ts`)と `useFetchDraftTask.ts` を、そこを参照するように直す。**`types.ts` の既存の `UnitType` / `CourseType` と衝突しないよう、`DraftTaskUnitType` / `DraftTaskCourseType` の別名にする。** 既存の `UnitType` / `CourseType` が使われているかは、`grep -rn "CreateTaskConfirm/types"` で確かめてから決める。

### 利用者に見える変化

- 取得に失敗したとき、空欄の確認画面ではなく、エラー表示と再試行が出る。401 のときは `/login` に遷移する。
- 取得中は、空欄の画面が後ろに見えなくなり、共通のスピナーだけが出る。
- 不正な ID で開いたとき、空欄の画面ではなく 404 になる。

## 比較した案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| A: `NaN` のときも取得して、失敗させてエラー表示にする | 不採用 | 意味のないリクエストを飛ばす。不正入力と障害を区別できない。再試行しても直らない画面に「再試行」が出る |
| B: 取得失敗をトースト(`useToast`)で知らせる | 不採用 | 画面が空欄のまま残る。エラー表示と再試行のほうが、次の行動を取れる |
| C: ローディングを `card-skeleton` にして、確認画面の骨格(2つの `FormSection`)を出す | 不採用 | 規約5は、フォームはスピナーと決めている。見た目の割り当ての見直しは TSK-216 の範囲 |
| D: 外側で `draftTask` が `null` の間の分岐を残す(内側に分けない) | 不採用 | 取得前の `null` を扱う分岐が `handleRegister` などに残る。内側に分けるほうが読みやすい |
| F: `CreateTask` の `useFetchDraftTask` も、このチケットで `useApiQuery` に移す | 不採用(別件) | `CreateTask` では `draftTaskId` が任意(新規作成時は無い)なので、取得をスキップする仕組みが要り(`useApiQuery` の `enabled` は #206 が追加する予定で未マージ)、スコープが広がる。`CreateTask` の黙殺は、別チケット候補として「その他」に記録する |
| E: 元の草案どおり、EditGoal / EditTask / Calendar といっしょにする | 不採用 | 価値の中心はこの画面の不具合修正だけで、他は TSK-219 待ちで価値も小さい。待ちの連鎖に巻き込まれる |

### Calendar を対象外にする理由

Calendar の `!month || !today` は、取得状態ではなく「ブラウザで日付が決まるまでの待ち」(サーバーとブラウザの日付のずれによるハイドレーションエラーの回避)である。取得失敗の表示は、すでに `ErrorState` と再試行がある。スピナーだけを `AsyncBoundary` に替えても、利用者に見える改善は無く、むしろ `100vh` から縮む。取得状態でないものを `data` で偽装することにもなる。したがって対象外とし、TSK-216 の許可リストに「ハイドレーション待ち」と理由つきで載せるか、走査テストで除外するかは、TSK-216 で決める。

## やること

### Red(現行で失敗する。実装前にテストだけを書いて落ちるのを確認してからコミットする)

- [ ] 目標の取得に失敗すると、エラー表示と再試行が出る(現行は空欄の画面)
- [ ] 下書きタスクの取得に失敗すると、エラー表示と再試行が出る
- [ ] 片方が失敗したとき、再試行で両方を取り直し、成功すると確認画面が出る(`mockRejectedValueOnce` ではなく、URL と呼び出し回数で分岐するモックを使う。モックの漏れを避ける)
- [ ] 401 のとき `/login` に遷移し、エラーは表示しない(現行は遷移しない)
- [ ] **取得が未解決の間、確認画面の中身(「確認」の見出し、「登録する」ボタン)が DOM に無く、共通のスピナーだけが出る**(サーバー描画のテストも)。現行は `Backdrop` の `progressbar` が出るので、`progressbar` の有無だけでは Red にならない。中身が出ていないことで判定する
- [ ] `page.tsx`(実装時に `searchParams` の型を `string | string[] | undefined` に直す。`notFound()` は例外を投げるので、テストでは `notFound` のモックに `throw` させるか `toThrow` で判定する。`next/navigation` の `notFound` をモックする): `goalId` / `draft_task_id` が、無い・空・英字・`"0"`・配列のとき `notFound()` を呼び、正常な値のときは呼ばない

### 回帰防止(現行でも通る)

- [ ] 既存の4件(表示、登録で post、登録失敗、キャンセル)が通り続ける
- [ ] 再試行で成功した側が、一瞬スピナーに戻らない

### 実装

- [ ] `index.tsx` を `AsyncBoundary` + 内側の `CreateTaskConfirmBody` にする。`CreateTaskConfirm/useFetchGoal.ts` とそのテストを削除する。`useFetchDraftTask.ts` は残す。`DraftTaskType` を別名の型とともに `types.ts` に移し、4か所の import を直す
- [ ] `CreateTask` が変わっていないこと(`useFetchDraftTask` のテストを含め、既存のテストが通ること)を確認する

## 完了条件

- [ ] 目標・下書きタスクのどちらの取得が失敗しても、エラー表示と再試行が出る。401 は `/login` に遷移する
- [ ] 取得に失敗した状態で、空欄の確認画面が出ない
- [ ] 不正な ID(無い・空・英字・0・配列)でページを開くと 404 になる
- [ ] `index.tsx` に `CircularProgress` と `Backdrop` の import が無く、`console.error` による取得失敗の握りつぶしが無く、`useFetchDraftTask` を import していない(`grep` で確かめる)
- [ ] `CreateTask`(`useFetchDraftTask` の利用者)の既存のテストが、変更なしで通る
- [ ] 実画面での確認(新規タスク作成 → 確認 → 登録、ネットワーク遮断、`draft_task_id` なし)は、オーナーの了承が得られた場合に行い、結果を PR 説明に書く。行わなかった場合は「未検証」と明記する
- [ ] `npm run test` / `lint` / `format:check` / `typecheck` が通る
- [ ] TSK-216 が未マージなら、マージ時に許可リストから外すことを TSK-216 側にコメントする(マージ済みなら外す)

## その他(別件として記録する事実)

- **同じエンドポイント(`/api/student/draft-tasks/:id`)の取得が、しばらく2経路になる**(`CreateTaskConfirm` は `useApiQuery`、`CreateTask` は残る `useFetchDraftTask`)。URL が変わると直す場所が2つになる。`CreateTask` を `useApiQuery` に移すときに、`useFetchDraftTask.ts`(`CreateTaskConfirm/` 配下にあるが、使うのは `CreateTask` だけになる)を削除する。
- `CreateTask`(タスク作成画面)も、`useFetchDraftTask` 経由で、下書きの取得失敗を黙殺する。`draftTaskId` が任意で、取得をスキップする仕組み(`enabled`。#206 が追加する予定で未マージ)が要るため、このチケットでは変えない。**別チケットにするかは、オーナーの判断。**

## 依存

- 「データ取得画面の表示分岐を共通化する AsyncBoundary コンポーネントを追加する」(マージ済み)
- 「取得状態を一元管理する useApiQuery フックを追加する」(マージ済み)
- 他のチケットには依存しない
