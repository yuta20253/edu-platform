# 批判：student/CreateTask の下書き取得失敗を画面に出す（第1周）

## 総評
分割で「取得しない」を表す発想は実コードと矛盾しない。ただし、効果は小さい割に、フォーム全体の移動と型名の衝突、テストの前提違いを抱えている。「やる価値」と「分割の大きさ」を見直したい。

## 判定
直せば進めてよい。
- 効果の主張は成り立つ。ただし頻度は極めて低い（後述）。
- 指摘1（`CreateTaskForm` の名前の衝突）、指摘2（既存テストの `draftTaskId={0}` が分岐を通らない）、指摘3（`reset` の `useEffect` を消す設計）は直さないと実装でつまずく。

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒） | 確認画面の「キャンセル」で戻ったとき、下書きの取得に失敗しても、空のフォームではなくエラー表示と再試行が出る。入力済みの内容が消えたと誤解せず、上書きもしない。 | 「戻る」の取得中は、フォームではなくスピナーだけが出る。成功時でも、現行より「フォームが一瞬出る」体験が無くなる代わりに、待ち時間が見える。変化は小さい。 |
| 開発チーム | 失敗の黙殺が1つ減る。`useFetchDraftTask`（旧式の独自フック）が消える。下書きありの経路から `null` 分岐が消える。 | `index.tsx` のほぼ全体を `CreateTaskForm` に移す大きな差分になる。`useDefaultValues`・`reset` の整理が必要。差分は「機能追加」ではなく大半が「移動」で、レビューしづらい。 |

- 両方にメリットがあるか：ある（ただし利用者側は弱い）。
  - 失敗は「確認画面で取得に成功した直後」の再取得で起きる。したがって実際の頻度は、ネットワーク断やセッション切れ程度にとどまる（推測。Confirm が直前に同じ API で成功している点から）。
  - 開発側のメリット（旧フックの削除、規約への統一）が実質的な理由で、これは本来の目的として十分。
  - 利用者への説明は「失敗時に誤解を防ぐ」と正直に書き、「頻度が低い」ことも書くとよい。
- やらないことのデメリット：
  - 利用者が失うもの：まれな失敗時に、空のフォームを見て入力し直す、または登録をあきらめる。損失は軽い。再度「キャンセル」を押せば復旧できる。
  - 開発チームが失うもの：`useFetchDraftTask` が `CreateTask` のためだけに残り、`console.error` で黙殺する旧式の仕組みが残る。TSK-216 の許可リストからも外せない。
- 草案に無いメリット・デメリット：
  - 草案に無いメリット：Go 移行時に独自の取得フックが減る。
  - 草案に無いデメリット：`useFetchDraftTask.ts` を `CreateTaskConfirm/` から消すと、`useDefaultValues.ts` などの import 先も変わる（指摘2）。

## 確かめた事実
- `CreateTask/index.tsx` を読んだ。`useFetchDraftTask`、`useCourses`、`useUnitSelection`、`useDefaultValues({draftTask, goalId})` で `useForm` の `defaultValues` を作り、さらに `useEffect` で `reset` と `setSelectedUnitIds` を呼ぶ。草案の記述と一致する。
- `useFetchDraftTask.ts` は失敗時に `console.error` のみ。一致する。
- `useApiQuery.ts` に `enabled` は無い。一致する。
- `new/page.tsx` は `Number(draftTaskId)` を渡す。`draftTaskId` 無しだと `NaN`。草案の記述は正しい。
- `isNumericId` は `libs/server/routeParams` にあり、API ルートでは使われている。ページでの利用は TSK-223 の草案に依存する（未マージ）。
- 「戻る」の実体は Confirm の「キャンセル」ボタン（`router.push(.../tasks/new?draftTaskId=...)`）。草案の「戻る」という呼び方はこれを指す。
- `CreateTask/types.ts` に `export type CreateTaskForm`（フォームの値の型）がある。草案が新設する `CreateTaskForm` コンポーネントと同名になる。
- 既存の `index.test.tsx` は 7 件で、すべて `draftTaskId={0}`。`apiClient.get` は全 URL に対して講座一覧の配列を返す。
- `useDefaultValues.ts` が `DraftTaskType` を `CreateTaskConfirm/useFetchDraftTask` から import している。

## 残すべき強み
- 未検証の前提を表にして、実画面確認とその条件（オーナーの了承）を書いている。
- 案 A（`enabled` 待ち）を、依存の理由で外している。
- 案 D（フックの条件付き呼び出し）を検討し、不採用の理由を述べている。
- Red と回帰防止を分けている。
- 依存（TSK-223 のマージ）と TSK-216 の許可リストの扱いが書かれている。

## 指摘（重要な順）

### 指摘1【重要】（観点：共通化の方針・規約との整合／スコープ）
- 何が問題か：新設する `CreateTaskForm` は、同じフォルダの `types.ts` にある型 `CreateTaskForm` と同名。`import { CreateTaskForm } from "../types"`（`useDefaultValues.ts`、`useSubmit.ts`）と衝突する。
- 根拠：`features/student/CreateTask/types.ts`、`hooks/useDefaultValues.ts`、`hooks/useSubmit.ts`。
- 直し方の提案：コンポーネントを `CreateTaskFormView` か `CreateTaskBody` にする（TSK-215 の `QuestionBody` と揃えるなら後者）。型は変えない。

### 指摘2【重要】（観点：テスト計画）
- 何が問題か：
  - 既存の 7 件は `draftTaskId={0}` で、`draftTaskId` が有効な経路を通らない。
  - 新しい Red では `apiClient.get` に下書き用の分岐を足す必要がある。今のモックは全 URL に講座一覧（配列）を返す。そのまま `draftTaskId={5}` を渡すと、配列が `draftTask` としてフォームに入る。
  - 「既存の 7 件が通り続ける」が回帰防止になっているのは、`draftTaskId` なしの経路だけ。
  - 「下書きがあるときの初期値が現行と同じ」は、現行でも通る回帰防止として正しい。ただしモックの URL 分岐（`/api/student/draft-tasks/` と `/api/student/courses`）が必要で、その書き方が書かれていない。
  - 未消化の `mockResolvedValueOnce` が漏れる危険（TSK-212 の教訓）がある。
- 根拠：`index.test.tsx` の `beforeEach` と各 `render`。
- 直し方の提案：
  - モックを `mockImplementation((url) => url.includes("draft-tasks") ? ... : { data: mockCourses })` の形に統一する。
  - 再試行のテストは、失敗 → 成功の順を URL 分岐の中で作る。
  - Red（失敗のテスト）と回帰防止（初期値）を同じ `describe` に混ぜない。コミットも分ける。
  - 「新規作成で下書きを取得しない」は、`get` の呼び出し引数に `draft-tasks` を含まないことで確かめる。講座一覧の `get` は教科選択のときに呼ばれるため、呼び出し回数では確かめない。

### 指摘3【重要】（観点：事実か推測か／設計と実コードの整合）
- 何が問題か：
  - 設計メモは「`reset` の `useEffect` など」を `CreateTaskForm` に移すと書く。
  - しかし分割すると `draftTask` は最初から props で揃っている。`useDefaultValues({draftTask, goalId})` で `defaultValues` が作られ、`useForm` の初期値になる。つまり `reset` の `useEffect` は冗長になる。
  - `setSelectedUnitIds(unitIds)` だけは別で、`useUnitSelection` の state を初期化するために必要。初期値を `useUnitSelection` に渡すか、`useEffect` を残すかの判断が要る。
  - 草案はこれを「初期値の流し込みが変わらない」という未検証の前提に入れているが、変わる点が実際にある。
    - 成功時に 1 回の描画で初期値が入るため、一瞬の空フォームは無くなる。これは良い変化。
    - `useEffect` を残すと、二重の初期化（`defaultValues` と `reset`）になる。TSK-217 の「三重の対策」と同種の重複。
- 根拠：`CreateTask/index.tsx` の `useEffect`、`useDefaultValues.ts` が `draftTask` ありの値を既に作っている。
- 直し方の提案：
  - 本命を決める。`defaultValues` を本命にして、`reset` の `useEffect` は削除する。
  - `setSelectedUnitIds` は `useUnitSelection(initialUnitIds)` のような引数にするか、`useEffect` を unit だけに絞る。どちらも、後続のテスト（下書きの単元がチェック済みで出る）で確かめる。
  - 草案の「内側に移す」を「`reset` を削除し、`defaultValues` に一本化する」と明記する。
  - ただし、この整理は差分を増やす。分けたいなら、まず「`reset` は触らず移すだけ」で出し、整理は別 PR でもよい。判断はオーナーに確認する。

### 指摘4【重要】（観点：代替案の比較）
- 何が問題か：
  - 案 B・C は「入力し直しを誘う」という理由で不採用にしているが、それは再試行より劣る前提に立つだけで、比較が浅い。
  - 失敗時の別の案が抜けている。たとえば「エラー表示に『新規作成として続ける』リンクも置く」案や、「エラー表示のまま Confirm に戻る導線を置く」案。再試行が何度も失敗するとき（ネットワーク断が続く、下書きが削除済みの 404 など）に、生徒の行き場がエラー表示のみになる。
  - 404 の扱いが書かれていない。`useApiQuery` は 401 以外を一律に「エラー」にする。下書きが無い（404）場合も再試行を出すと、直らない再試行になる。
- 根拠：`useApiQuery.ts` の `catch`（401 以外は `setError(true)`）。`errorStatus` の拡張は TSK-219 側にある。
- 直し方の提案：
  - 「404 は再試行しても直らない」ことを書き、許容するなら理由を書く。許容しないなら `errorStatus` の拡張が済むまで待つか、404 は `notFound()` か新規作成への導線にする案を比較表に入れる。
  - 少なくとも、エラー表示に「新規作成へ」のリンクを出すかどうかを案として比較する。

### 指摘5【重要】（観点：規約との整合／状態の流用）
- 何が問題か：`useApiQuery` の url は変わらないが、`DraftTaskLoader` は `draftTaskId` が変わるとデータが前の対象のまま残る（`useApiQuery` のコメントに書かれた注意点）。
- 根拠：`useApiQuery.ts` の冒頭コメント。TSK-217 の実画面確認では App Router が作り直したため起きなかった（答え合わせ表）。この画面も `?draftTaskId=` の変更は `router.push` でページ遷移になるため、同じ可能性が高い（推測）。
- 直し方の提案：対策は入れず、「遷移で作り直されるため key は不要。TSK-217 で確認済み」と一行書く。実画面確認の項目に、`draftTaskId` を変えての遷移も含める（入れすぎないこと）。

### 指摘6【軽微】（観点：完了条件が測れるか）
- 何が問題か：
  - 完了条件の「TSK-216 が未マージなら…コメントする」は、完了を確かめる対象が別チケットで、測りにくい。
  - 「実画面での確認はオーナーの了承が得られた場合に行う」は、行わないと決めるまで完了にできない。
- 直し方の提案：「実画面の確認をしない場合は『未検証』と PR に書く」を完了条件の正式な 2 択にする。TSK-216 の件は「依存」節に移す。

### 指摘7【軽微】（観点：スコープと依存）
- 何が問題か：
  - TSK-223 のマージ待ちが依存になっている。
  - `DraftTaskType` の移動先（`types.ts`）と `useDefaultValues.ts` の import 先の変更が TSK-223 に含まれるか、このチケットで直すかが曖昧。
- 直し方の提案：どちらのチケットで `useDefaultValues.ts` の import を直すかを一行で決める。TSK-223 で移動するなら、このチケットは import を前提にして書く。

## 本人に確認すべき問い
1. 失敗の頻度がきわめて低いこと（確認画面で取得成功した直後の再取得）を踏まえても、フォーム全体の移動を伴う分割に価値があると考えるか。軽く済ませるなら、フックを `useApiQuery` に置き換えて、失敗時だけエラー表示を出す最小版（フォームの上に `ErrorState` を出す）もある。ただし案 C の欠点（入力を誘う）が出る。
2. `reset` の `useEffect` を削除して `defaultValues` に一本化するか、移動だけにして整理を別 PR にするか。
3. 404（下書きが無い／他人の下書き）のとき、再試行でよいか。別の導線（新規作成へ）が要るか。
4. 実画面の確認（ネットワーク遮断）を行う了承が得られるか。
