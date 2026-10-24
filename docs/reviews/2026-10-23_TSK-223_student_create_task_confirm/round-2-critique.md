# 批判：student/CreateTaskConfirm の取得失敗表示と不正 ID の 404（第2周）

## 前回の指摘の扱いの確認
- 指摘1（分割）：直った。draft.md は CreateTaskConfirm 単独で、依存に TSK-219 が無い。
- 指摘2（NaN を取得して失敗させない）：方針は直った。ただし実装方法に問題がある（下の指摘2）。
- 指摘3（Calendar を外す）：直った。草案本文に理由が書かれている。外す判断自体はオーナー判断待ち。
- 指摘4（合成設計）：直った。`data`・`error`・`onRetry`・`fallback`・内側の Body まで書かれている。コードとも矛盾しない（下で確認）。
- 指摘5（テスト計画）：Red と回帰防止の分け方、URL 分岐のモック、401 は直った。実画面確認は未検証のまま残してあり、オーナー判断待ちなので妥当。
- 指摘6（完了条件）：直った。
- 指摘7（EditGoal/EditTask の記述）：別草案の話なのでここでは対象外。
- 「対応表が直したと書いたのに直し忘れ」は、指摘4の「削除対象」の範囲で見つかった（下の指摘1）。

## 総評
方針と合成設計は固まっています。ただし「`useFetchDraftTask` を削除する」という前提が、実コードと矛盾しています。このまま実装すると別画面が壊れます。

## 判定
直せば進めてよい。削除範囲の誤り（致命的）と、ID 検証の書き方（重要）を直せば進められます。

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒） | 取得失敗でエラー表示と再試行が出る。空欄で「登録する」が無反応になる状態が無くなる。401 でログイン画面へ遷移する。不正 ID は空欄画面でなく 404 になる。 | 取得中の表示が全画面 Backdrop から `minHeight: 240` のスピナーに変わる。草案は「見える変化」に書いており、隠してはいない。 |
| 開発チーム | 取得状態の分岐が共通部品に揃う。`Backdrop` と `CircularProgress` の直書きが消える。取得前の `null` 分岐が `handleRegister` から消える。 | 草案に無いデメリット：`useFetchDraftTask` は `CreateTask` も使っており、削除すると影響が出る。型の移動先にも衝突がある。 |

- 両方にメリットがある。
- やらないことのデメリット：
  - 利用者が失うもの：失敗の黙殺が残り、空欄画面と無反応の登録ボタンが残る。
  - 開発チームが失うもの：TSK-216 の許可リストに残り続ける。
- 草案に無かった点：隣の `CreateTask` 画面にも同じ黙殺（`useFetchDraftTask` 経由）が残ること。

## 確かめた事実
- 一致した点：
  - `page.tsx` は `Number(goalId)` と `Number(draft_task_id)` をそのまま渡している。
  - `useFetchGoal` と `useFetchDraftTask` は `catch` で `console.error` のみ。
  - `index.tsx` に `if (!draftTask) return` と `Backdrop` がある。
  - `useApiQuery` は 401 で `router.push("/login")` し、`error` は立てない。再取得中も `data` を残す。
  - `AsyncBoundary` は `data` を 1 つだけ受け取る。
  - 既存の `index.test.tsx` は URL 分岐の `mockImplementation` で 4 件。
  - `notFound()` は admin にある。
- 食い違い 1（致命的）：`features/student/CreateTask/index.tsx` が `../CreateTaskConfirm/useFetchDraftTask` から `useFetchDraftTask` を import している。草案は「`useFetchDraftTask.ts` を削除し、他から使われる型は `types.ts` に移す」としか書いておらず、フック本体が使われていることに触れていない。
- 食い違い 2：`DraftTaskType` の import 元は 4 か所ある。
  - `CreateTaskConfirm/hooks.ts`
  - `CreateTaskConfirm/hooks.test.ts`
  - `CreateTask/hooks/useDefaultValues.ts`
  - `CreateTask/hooks/useDefaultValues.test.ts`

  後ろ 2 つは別ディレクトリです。
- 食い違い 3：`types.ts` には既に `UnitType`（`course` なし）と `CourseType`（`description`・`units` あり）がある。`useFetchDraftTask.ts` 内の同名のローカル型は形が違う。そのまま移すと名前が衝突する。
- 食い違い 4：`libs/server/routeParams.ts` に `isNumericId`（`/^\d+$/`）がある。admin の `page.tsx` はこれを使っている。草案が「先例」とする書き方は `Number.isInteger` ではなく `isNumericId` だった。

## 残すべき強み
- 分割と案 E の不採用。
- 案 A（NaN を取得して失敗させる）を退けた比較。
- 「検証済み／未検証」の表の分け方。
- Red と回帰防止の区別。モックの漏れを避けるため URL と回数で分岐する、という指定。
- 合成設計を `QuestionBody` と同じ形に揃えたこと。
- Calendar を外す理由の具体性。

## 指摘（重要な順）

### 指摘1【致命的】（観点：スコープ／事実か推測か）`useFetchDraftTask` は別画面 `CreateTask` が使っている
- 何が問題か：
  - 草案どおり削除すると `CreateTask`（新規タスク作成画面）がビルドできなくなる。
  - 型だけ移して済む話ではなく、`CreateTask` のフックの扱いを決める必要がある。
- 根拠：`CreateTask/index.tsx` の `import { useFetchDraftTask } from "../CreateTaskConfirm/useFetchDraftTask"` と、`useFetchDraftTask(draftTaskId ? Number(draftTaskId) : null)` の呼び出し。
- 直し方の提案（草案に書いて決める）：
  - 案(a)：フックは残し、`CreateTaskConfirm` だけ `useApiQuery` に移す。削除するのは `useFetchGoal.ts` とそのテストだけにする。`DraftTaskType` は `types.ts` に移し、フックと 4 か所の import がそこを参照する。
  - 案(b)：`CreateTask` も同じチケットで `useApiQuery` に移す。ただしスコープが広がり、`CreateTask` では `draftTaskId` が任意（新規作成時は無い）なので、スキップの仕組みが要る。
  - 推奨は(a)。`CreateTask` 側の黙殺は別チケット候補として書き残す。
  - 「`index.tsx` が `useFetchDraftTask` を import していない」を完了条件に足す。

### 指摘2【重要】（観点：共通化の方針／規約との整合）ID の検証は既存の `isNumericId` を使う
- 何が問題か：
  - `Number.isInteger(n) && n > 0` は、`Number(" 12 ")` や `Number("1e3")`（= 1000）を通す。`searchParams` が配列のとき `Number(["1"])` が 1 になる、という穴もある。
  - 先例の `isNumericId` は `/^\d+$/` で文字列のまま検証する。草案は先例を引いているのに、書き方が違う。
  - `/^\d+$/` は `0` も通す。0 を弾くなら `Number(x) > 0` の併用が要るが、草案の「0 は 404」と整合させる点は決めておく。
- 直し方の提案：`isNumericId(goalId)` と `isNumericId(draft_task_id)`（`undefined` は不合格）に変える。0 の扱いを決めて 1 行書く。`page.tsx` のテストは `next/navigation` の `notFound` をモックし、無い・空・英字・0・正常の 5 パターンを書く。

### 指摘3【重要】（観点：設計の整合）`DraftTaskType` の移動先で型が衝突する
- 何が問題か：`types.ts` の `UnitType` と `CourseType` は、`useFetchDraftTask.ts` 内のローカル型と別物（形が違う）。そのまま追記すると衝突する。
- 直し方の提案：`DraftTaskUnitType` や `DraftTaskCourseType` のように別名にする。または `DraftTaskType` の中にインラインで書く。なお `types.ts` の既存の `UnitType` と `CourseType` の使用箇所は、今回の grep では `CreateTaskConfirm` 配下に見つからなかった。未使用かどうかは未確認（確かめる方法：`grep -rn "from.*CreateTaskConfirm/types"`）。

### 指摘4【軽微】（観点：テスト計画）Red の中に偽陽性の恐れがある項目がある
- 何が問題か：
  - 「取得中はスピナー」は、現行コードでも `Backdrop` の `progressbar` が出る。`role=progressbar` の有無だけでは Red にならない。
  - Red になる条件は「取得完了前に『目標内容』の見出しなどが出ていない」こと。
- 直し方の提案：Red の条件を「取得が未解決の間に `確認` や `登録する` ボタンが DOM に無い」と書く。
- 補足：「再試行で成功側が一瞬スピナーに戻らない」は、`useApiQuery` の仕様どおり戻らない見込み（コードで確認済み）で、草案の「回帰防止」の位置づけで妥当。

### 指摘5【軽微】（観点：失敗の想定）片方失敗の再試行で、成功済みの側の再取得が失敗した場合
- 何が問題か：一度成功した側の `data` は残るが、`error` が立つ。`goalError || draftTaskError` は `AsyncBoundary` の `error` を優先するので、確認画面は消えてエラー表示になる。許容できる動作だが、草案に書かれていない。
- 直し方の提案：「再取得の失敗でも画面はエラー表示になる」と 1 行足す。

## 本人に確認すべき問い
1. 指摘1の(a)と(b)のどちらにするか。推奨は(a)で、`CreateTask` の黙殺は別チケットにする。
2. 草案のとおり、Calendar の扱いは TSK-216 側で決める。
3. 不正 ID は 404（`notFound()`）でよいか。
4. 実画面確認（ネットワーク遮断、`draft_task_id` なし）を行うか。未検証の記録は草案に書かれている。ただし、`CreateTask` が `useFetchDraftTask` を残す方針になるなら、「新規タスク作成 → 確認 → 登録」の通し確認は必須に近い。

## オーナー判断で進められるものと、草案を直さないと進められないものの区別
- 草案を直さないと進められないもの：指摘1（削除範囲）、指摘2（検証関数）、指摘3（型の移動先）。
- 直せば足りる軽微なもの：指摘4・5。
- オーナー判断待ち：Calendar の扱い、404 か `ErrorState` か、実画面確認の可否、指摘1の(a)/(b)。

参照ファイル：
- /Users/ryonakadoi/Documents/app/edu-platform/docs/reviews/2026-10-23_student_create_task_confirm/draft.md
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/index.tsx
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTaskConfirm/useFetchDraftTask.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTaskConfirm/types.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/libs/server/routeParams.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/app/(admin)/admin/(authenticated)/notices/[noticeId]/edit/page.tsx
