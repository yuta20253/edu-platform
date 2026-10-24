# 批判：student/CreateTaskConfirm の取得失敗表示と不正 ID の 404（第3周・最終）

## 前回の指摘の扱いの確認
第2周の5件を、対応表の主張と draft.md の本文で1件ずつ突き合わせました。

- 指摘1（`useFetchDraftTask` は `CreateTask` も使っている）：**直った**。
  - 「削除するのは `CreateTaskConfirm/useFetchGoal.ts` とそのテストだけ」という方針が、次の6か所で一貫しています。
    - 概要
    - 背景
    - 設計の削除項目
    - 比較表の案F
    - やること
    - 完了条件
  - 古い「useFetchDraftTask を削除する」の記述は残っていません。
  - 依存は他のチケットに及ばず、依存の節に矛盾もありません。
  - 実コードとも合っています。
    - `CreateTask/index.tsx:23` が `useFetchDraftTask` を import しています。
    - `CreateTaskConfirm/index.tsx:19` は同じフックを import しています。これは移行後に消えます。
- 指摘2（`isNumericId` を使う）：**直った**。`libs/server/routeParams.ts` の実装は `/^\d+$/` で、草案の説明と一致します。`"0"` を `Number(x) > 0` で弾く点も整合しています。
- 指摘3（型名の衝突）：**直った**。
  - `DraftTaskType` の import は、実コードでも4か所でした。
    - `CreateTaskConfirm/hooks.ts`
    - `CreateTaskConfirm/hooks.test.ts`
    - `CreateTask/hooks/useDefaultValues.ts`
    - `CreateTask/hooks/useDefaultValues.test.ts`
  - 5つめの利用者は、定義元の `useFetchDraftTask.ts` 自身です。草案はこれも直すと書いています。
  - `types.ts` の `UnitType` / `CourseType` は、`CreateTaskConfirm` 配下から import されていません。import されているのは `GoalType` だけです。そのため、別名にする方針は安全側で妥当です。
- 指摘4（Red の偽陽性）：**直った**。「中身が DOM に無いこと」で判定する形に変わっています。
- 指摘5（再取得失敗の挙動）：**直った**。設計に1行入っています。

## 総評
第2周の致命的な誤りは、全箇所で消えています。改訂で新しく入った致命的な問題は見つかりませんでした。残るのは、草案の1行を足せば済む軽微な点と、オーナーの判断待ちだけです。

## 判定
**このまま進めてよい**

実装中に1行補えば済む軽微な点（指摘1〜3）が残ります。ただし、どれも設計を変える内容ではなく、`/ticket` で実装しながら拾えます。第3周が最終周なので、草案の再改訂は不要と判断します。

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒） | 取得失敗でエラー表示と再試行が出る。空欄で「登録する」が無反応になる状態が消える。401 は `/login` に遷移する。不正 ID は空欄画面でなく 404 になる。 | 取得中の表示が、全画面 `Backdrop` から共通スピナーに変わる。草案の「利用者に見える変化」に書かれている。 |
| 開発チーム | 取得状態の分岐が `AsyncBoundary` / `useApiQuery` に揃う。取得前の `null` 分岐が消える。不要な `useFetchGoal` が1本減る。 | `useFetchDraftTask` が残るため、同じエンドポイント（`/api/student/draft-tasks/:id`）の取得が2経路になる（指摘1）。 |

- 両方にメリットがある。
- やらないことのデメリット：
  - 利用者が失うもの：空欄の確認画面と、無反応の登録ボタンが残る。
  - 開発チームが失うもの：TSK-216 の許可リストに残り続ける。
- 草案に無いデメリット：上の「同じエンドポイントの取得が2経路」（指摘1）。

## 確かめた事実
- `confirm/page.tsx` は今も `Number(goalId)` / `Number(draft_task_id)` をそのまま渡しています。`searchParams` の型は `{ draft_task_id: string }` です。
- 現行 `index.tsx` は、`if (!draftTask) return` と、下書きの `isLoading` だけの `Backdrop` を持ちます。目標の取得中は何も出ません。草案の記述どおりです。
- `useFetchGoal` / `useFetchDraftTask` はどちらも `catch` で `console.error` するだけです。
- 現行の `CreateTaskConfirm/index.test.tsx` は URL 分岐の `mockImplementation` です。`CreateTask/index.test.tsx` は `apiClient` をモックし、フックそのものはモックしていません。したがって、型を移しても `CreateTask` のテストは壊れない見込みです。
- `useApiQuery` は次の挙動で、草案の前提と一致します。
  - 401 では `/login` に遷移し、`error` を立てない。
  - 再取得中も `data` を残す。
  - `refetch` を返す。
- 古い記述は残っていません。`useFetchDraftTask` を削除対象にする記述は、draft.md 内の検索で見つかりませんでした。

## 残すべき強み
- 分割と、案Eの不採用。
- 案A〜Fの比較表。案Fで `enabled` が未マージであることを理由にしている点。
- 「検証済み／未検証」の表。
- Red と回帰防止の分け方。
- `useFetchDraftTask` を残した判断を、完了条件（`CreateTask` の既存テストが変更なしで通ること）にまで落としている点。

## 指摘（重要な順）

### 指摘1【軽微】（観点：開発チームのデメリット）同じエンドポイントを2経路で取得する
- 何が問題か：
  - 新しい `CreateTaskConfirm` は、`useApiQuery` で `/api/student/draft-tasks/${id}` を取得します。
  - 残る `useFetchDraftTask` も同じ URL を取得します。
  - URL が変わると、直す場所が2つになります。
  - 残った `useFetchDraftTask` は、`CreateTask` から使われるだけの置き場違いのフックになります（`CreateTaskConfirm/` 配下にあるため）。
- 直し方の提案：
  - 「その他」の別チケット候補に、次の1行を足します。
    - 「`CreateTask` を `useApiQuery` に移すとき、`useFetchDraftTask.ts` を削除する」
    - 「それまでは URL が2か所にある」
  - 草案の本文や設計は変えなくてよい。

### 指摘2【軽微】（観点：テスト計画／型）`page.tsx` の型と `isNumericId` の引数の型が合わない
- 何が問題か：
  - `isNumericId(value: string)` は文字列しか受けません。
  - 一方で、草案は `undefined` と配列も不合格にすると書いています。
  - `searchParams` の型は `draft_task_id: string` のままなので、型を直さないとテスト側で「配列」「無い」を渡しにくくなります。
  - 実装では `typeof x === "string" && isNumericId(x) && Number(x) > 0` のような組み立てが必要です。
- 直し方の提案：
  - 実装時に `searchParams` の型を `string | string[] | undefined` に直す。
  - `notFound()` は例外を投げるので、テストでは `notFound` のモックを `throw` させるか、`toThrow` で判定する。
  - これは設計の変更ではないので、草案の修正は要りません。

### 指摘3【軽微】（観点：完了条件が測れるか）完了条件のうち、1項目が測りにくい
- 何が問題か：
  - 「`index.tsx` に…取得失敗の分岐の直書きが無く」は、何で確かめるかが曖昧です。
- 直し方の提案：
  - 「`index.tsx` に `console.error` による取得失敗の握りつぶしが無い」「`index.tsx` が `Backdrop` を import していない」など、grep で確かめられる形にする。
  - 草案の修正は不要で、PR の確認時に grep で確かめれば足ります。

## 草案を直さないと進められないものと、オーナー判断で進められるものの区別

- **草案を直さないと進められないもの：無し。**
  - 指摘1〜3は、いずれも実装中、または PR の記述で吸収できます。
- **オーナーの判断を仰げば進められるもの（草案は直さなくてよい）：**
  - Calendar を対象外にして、TSK-216 側で扱うこと。
  - `CreateTask` の黙殺を別チケットにするか。
  - 不正 ID を `notFound()` にすること。
  - 実画面確認をやるか。
    - 未検証のまま進める場合は、完了条件のとおり PR に「未検証」と明記する。
    - 実画面確認で見るべきは、「新規タスク作成 → 確認 → 登録」の通しと、`draft_task_id` なしの2点。
    - 理由は、`CreateTask` が `useFetchDraftTask` を残すので、型の移動と合わせて通し確認の価値が高いから。
- **オーナー判断が要るが、返事を待たずに実装へ進めてよいもの：**
  - 不正 ID の 404。
    - 同じ書き方の先例が admin にあります。
    - 違う判断になっても、`page.tsx` の数行を直すだけで済みます。

## 本人に確認すべき問い
1. `CreateTask` の黙殺を別チケットにするか（推奨：する。指摘1の1行を添えて）。
2. Calendar を対象外にして、TSK-216 側で扱うことでよいか。
3. 不正 ID は 404（`notFound()`）でよいか。
4. 実画面確認を行うか（行わない場合は PR に「未検証」と明記）。

参照ファイル：
- /Users/ryonakadoi/Documents/app/edu-platform/docs/reviews/2026-10-23_student_create_task_confirm/draft.md
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTaskConfirm/index.tsx
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTaskConfirm/useFetchDraftTask.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTaskConfirm/types.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/index.tsx
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/libs/server/routeParams.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/app/(main)/(authenticated)/goals/[goalId]/tasks/confirm/page.tsx
