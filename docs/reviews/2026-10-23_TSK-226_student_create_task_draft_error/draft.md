## 概要

`features/student/CreateTask`(タスク作成画面)で、下書きタスクの取得に失敗しても何も表示されず、空のフォームが出る問題を直す。下書きがあるときだけ取得する内側のコンポーネントに分け、`useApiQuery` + `AsyncBoundary` で、失敗時にエラー表示と再試行を出す。

あわせて、`reset` と `defaultValues` で重複している初期値の流し込み（`useEffect`）を、最後の別コミットで `defaultValues` に一本化する。

TSK-223(CreateTaskConfirm の取得失敗を画面に出す)で「別件」として記録した件。`useApiQuery` の `enabled`(#206 が追加予定で未マージ)に頼らず、コンポーネントの分割で「下書きが無いとき(新規作成)は取得しない」を表す。

## 背景(調査結果)

- `CreateTask` は、`useFetchDraftTask(draftTaskId ? Number(draftTaskId) : null)` で下書きを取得し、取得できたら `useEffect` の `reset(...)` でフォームに流し込む。**失敗すると `console.error` するだけ**で、`draftTask` は `null` のまま。フォームは、新規作成のときと同じ初期値で表示される。
- この画面には、2つの入り方がある。
  - **新規作成**: `draftTaskId` が無い(`page.tsx` で `Number(undefined)` が `NaN` になり、フックは `null` として扱う)。下書きは無いので、取得しない。
  - **確認画面の「キャンセル」で戻る**(`/goals/:goalId/tasks/new?draftTaskId=…`): 下書きの内容をフォームに戻す。
- したがって、「キャンセル」で戻ってきたのに下書きの取得に失敗すると、**生徒は入力済みの内容が消えたように見える**(空のフォームが出るため)。気づかずに入力し直す、または登録をあきらめる恐れがある。
- **ただし頻度は低い**: 確認画面は、直前に同じ下書きの取得に成功している。失敗するのは、そのあとのネットワーク断やセッション切れなどに限られる(推測)。やらなくても、生徒の損は軽い(もう一度「キャンセル」を押せば戻れる)。このチケットの主な理由は、**黙殺する旧式の取得フック(`useFetchDraftTask`)を消し、規約に揃える**という開発側のメリットである。
- `useApiQuery` には「取得しない」指定(`enabled`)が現行では無い(#206 が追加予定)。
- `useFetchDraftTask.ts` は `CreateTaskConfirm/` 配下にあるが、TSK-223 のあとは `CreateTask` だけが使う。`DraftTaskType` の移動(`types.ts`)と、`CreateTask/hooks/useDefaultValues.ts` などの import の直しは、**TSK-223 で行う**。このチケットは、その後の状態を前提にする。
- `CreateTask/types.ts` に、フォームの値の型 `CreateTaskForm` がある。コンポーネント名と衝突させない。
- 既存の `CreateTask/index.test.tsx`(7件)は、すべて `draftTaskId={0}`(新規作成の経路)で、`apiClient.get` は全 URL に講座一覧を返すモック。**下書きのある経路は、現行でテストされていない。**

### 検証済みの前提

| 前提 | 確かめ方 | 結果 |
| --- | --- | --- |
| 下書きの取得失敗は `console.error` のみで、画面に出ない | `CreateTaskConfirm/useFetchDraftTask.ts` を読む | そのとおり |
| `draftTaskId` が無いと `NaN` になり、フックは取得しない | `CreateTask/index.tsx`、`new/page.tsx` を読む | `Number(draftTaskId)` が `NaN` → `draftTaskId ? … : null` で `null` |
| `useDefaultValues({ draftTask, goalId })` が、`draftTask` があるときの値(タイトル・内容・優先度・期限・単元)を、すでに作っている。さらに `useEffect` で `reset(...)` と `setSelectedUnitIds(...)` を呼ぶ | `CreateTask/index.tsx`、`hooks/useDefaultValues.ts` を読む | そのとおり。**`reset` は、`defaultValues` と重複している** |
| `useUnitSelection` は、引数なしで `selectedUnitIds` を `[]` から始める。EditTask も使う | `hooks/useUnitSelection.ts`、`EditTask/index.tsx` を読む | そのとおり |
| `types.ts` に、`CreateTaskForm`(型)がある | `CreateTask/types.ts` を読む | そのとおり。同名のコンポーネントは作れない |
| `useApiQuery` に `enabled` が無い | `hooks/useApiQuery.ts` を読む。#206 の差分 | 無い。#206(未マージ)が追加する |
| 既存の `index.test.tsx` は7件で、すべて `draftTaskId={0}`。下書きの取得失敗のテストが無い | `index.test.tsx` を読む | そのとおり |
| `useSubmit` は送信時に `unit_ids: selectedUnitIds` でフォーム値を上書きする | `useSubmit.ts` を読む | そのとおり。単元の実体は `selectedUnitIds` の state で、フォーム値の `unit_ids` は送信に使われない |
| 下書きの `priority` は、API では文字列（`"normal"` など）で返る見込み | `rails/app/models/draft_task.rb`（`enum priority`）、serializer、`DraftTaskType.priority: string` | Rails の enum は文字列で返る。一方 `useDefaultValues` / `reset` は `typeof priority === "number"` のときだけ採用し、それ以外は「普通」にする。**戻っても優先度が「普通」に戻る既存の不具合の可能性が高い**（実レスポンスは未確認） |

### 未検証の前提

| 前提 | 確かめる方法 |
| --- | --- |
| 確認画面から「キャンセル」で戻ってきて下書きの取得に失敗すると、空のフォームが出る | 実画面で、ネットワーク遮断で再現する(開発サーバーと生徒アカウントが要る。オーナーの了承を得てから) |
| `?draftTaskId=` が変わる遷移で、前の下書きが残らない(`useApiQuery` は url が変わっても前の data を残す) | `router.push` によるページ遷移で、App Router がページを作り直す(TSK-217 の実画面確認で確認済みの構造)ため、`key` は不要と見ている。実画面で確かめる |
| 404(下書きが削除済み・他人の下書き)のとき、再試行を出しても直らない | `useApiQuery` は 401 以外を一律にエラーにする。許容する(下の「404 の扱い」)。TSK-219(`errorStatus`)のマージ後に再検討する |

## 設計

- **Props**: `draftTaskId: number | null` にする。`new/page.tsx` は、パラメータが無いとき `null`、有効なとき数値を渡す。`0` は無効（`Number>0` を満たさない）として `notFound()`。既存7件の `draftTaskId={0}` は `draftTaskId={null}` に直す（回帰防止の最初のコミットで行う）。
- **優先度の不具合は、このチケットでは直さない**。「戻ると毎回『普通』に戻る」ため、頻度は取得失敗より高い。**別チケット TSK-225 で直す**（オーナーが別チケットに決定済み）。回帰防止のテストでは優先度を比べない（固定すると不具合を固定してしまうため）。
- **利用者に見える変化**: 不正な `draftTaskId`（`0`・空文字・文字列・配列）は 404 になる（現行は新規作成として開いていた）。遷移元の「キャンセル」は有効な数値しか作らないので実害は小さい。空文字・配列は `notFound()` に倒す。
- **単元の二重管理**（フォーム値の `unit_ids` と `selectedUnitIds`）は範囲外。別件。

- `CreateTask`(外側)は、`draftTaskId` が有効なとき(`page.tsx` が TSK-223 と同様に `isNumericId` で検証した値)だけ、下書きを取得する内側のコンポーネント(`DraftTaskLoader`)を描画する。無いとき(新規作成)は、取得せずに、フォーム本体(`CreateTaskBody`)を `draftTask = null` で描画する。
- `DraftTaskLoader` は、`useApiQuery<DraftTaskType>(`/api/student/draft-tasks/${id}`)` で取得し、`AsyncBoundary` で包み、成功したら `CreateTaskBody` に `draftTask` を渡す。失敗時はエラー表示と再試行(`onRetry`)を出す。401 は `/login` に遷移する。
- `CreateTaskBody`(コンポーネント名は `QuestionBody` と揃える)は、今の `CreateTask` の中身(フォーム、`useCourses` など)を移したもの。`draftTask` は props で受ける。
- **初期値は `defaultValues` に一本化する**: 分割後は、`draftTask` が最初から揃っているので、`useDefaultValues` が作る `defaultValues` が `useForm` の初期値になる。**`reset` の `useEffect` は削除する**(重複するため)。選択済みの単元は、`useUnitSelection` に省略可能な初期値の引数(`initialIds = []`)を足して渡し、`setSelectedUnitIds` の `useEffect` も削除する(`EditTask` など、引数なしの呼び出しは変わらない)。
- **進め方**: まず、下書きありの経路の初期値を固定する回帰防止のテストを書く(現行で緑)。次に、分割だけを行い(`reset` は触らず移すだけ)、緑のままにする。最後に、`reset` と `setSelectedUnitIds` の `useEffect` を削除する整理を、別コミットで行う(整理が問題なら、その1コミットだけ戻せる)。
- `useFetchDraftTask.ts` とそのテストを削除する。
- 取得中は、共通のスピナーが出る。成功時、現行にあった「空のフォームが出てから内容が入る」状態が無くなる。

### 404 の扱い

`useApiQuery` は 401 以外のエラーを区別しない(`errorStatus` は TSK-219 の範囲)。そのため、下書きが無い(404)ときも、直らない「再試行」が出る。**許容する**: 確認画面は直前に同じ下書きの取得に成功しており、404 になるのは、その後に下書きが削除された場合などに限られる(まれ)。エラー表示に「新規作成へ」の導線を足す案は、`AsyncBoundary` に追加アクションを渡す仕組みが無いため、見送る。TSK-219 のマージ後に、404 のとき `notFound()` や新規作成への導線にするかを再検討する。

### 利用者に見える変化

- 「キャンセル」で戻って下書きの取得に失敗したとき、空のフォームではなく、エラー表示と再試行が出る(**頻度は低い**)。
- 取得中は、共通のスピナーが出る。新規作成のときは、これまでどおり。

## 比較した案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| A: #206 の `enabled` を待って、`useApiQuery(url, { enabled: draftTaskId != null })` にする | 不採用 | 未マージの変更に依存する。コンポーネントの分割で、`enabled` が無くても表せる |
| B: 失敗時は、空のフォームのまま、トーストで知らせる | 不採用 | 生徒が入力し直すと、下書きを上書きしてしまう |
| C: 失敗時に、エラー表示の下に空のフォームを出す(新規作成として続けられる) | 不採用 | 入力し直しを誘う。上書きの恐れは B と同じ。ただし、これは再試行より劣るというだけでなく、**下書きの内容が消えたと誤解させる**点が主な理由 |
| D: 1つのコンポーネントで `useApiQuery` を条件付きで呼ぶ | 不採用 | フックは条件付きで呼べない |
| E: エラー表示に「新規作成へ」のリンクも置く | 不採用(保留) | `AsyncBoundary` に追加アクションを渡す仕組みが無い。404 の扱い(TSK-219 後)といっしょに再検討する |
| F: 最小版: フックを `useApiQuery` に置き換え、失敗時だけフォームの上に `ErrorState` を出す | 不採用 | 案 C の欠点が出る。`enabled` が要るため、結局 #206 待ちになる |
| G: `reset` の `useEffect` を残したまま、移すだけにする | 一部採用 | 最初のコミットでは移すだけにする。重複する `reset` の削除は、最後の別コミットで行う |

## やること

### 回帰防止(現行でも通る。最初に書いて、現行で緑にする)

`apiClient.get` のモックは、**URL で分岐する**(`url.includes("draft-tasks") ? 下書き : 講座一覧`)。未消化の `mockResolvedValueOnce` の漏れを避けるため、`beforeEach` で `mockReset` する。Red と混ぜず、コミットも分ける。

- [ ] 既存の7件(新規作成の経路。`draftTaskId={0}` を `{null}` に直す)が通り続ける
- [ ] 下書きがあるとき(`draftTaskId` ありで取得に成功)、フォームの初期値(タイトル・内容・期限。優先度は比べない)と、単元が現行と同じになる。単元は、(a) 下書きの単元がチェック済みで表示される、(b) 送信時の POST ボディの `unit_ids` が下書きの単元になる、の2点で確かめる(フォーム値の `unit_ids` は送信時に上書きされるので見ない)
- [ ] 新規作成(`draftTaskId` なし)では、下書きを取得しない(`get` の呼び出しの中に `draft-tasks` を含むものが無い。講座一覧の `get` は教科選択で呼ばれるので、呼び出し回数では確かめない)

### Red(現行で失敗する。実装前にテストだけを書いて落ちるのを確認してからコミットする)

- [ ] `draftTaskId` ありで、下書きの取得に失敗すると、エラー表示と再試行が出る(現行は空のフォーム)
- [ ] 失敗 → 再試行 → 成功のあと、下書きの内容がフォームに入る(失敗の次に成功を返す、URL と呼び出し回数で分岐するモックを使う)
- [ ] 401 のとき `/login` に遷移し、エラーは表示しない(現行は遷移しない)
- [ ] `draftTaskId` ありで、取得が未解決の間は、フォームの中身(「タスク作成」の見出し、入力欄)が DOM に無く、共通のスピナーだけが出る(現行は空のフォームが出る。`progressbar` の有無では判定しない)

### 実装

- [ ] `CreateTask` を、`CreateTaskBody` と `DraftTaskLoader` に分ける(`reset` は触らず移すだけ)。`useFetchDraftTask.ts` とそのテストを削除する
- [ ] `new/page.tsx` で `draftTaskId` を `isNumericId` と `Number>0` で検証する(無いときは `null` を渡して新規作成。`0`・不正な値は `notFound()`)
- [ ] `page.tsx` の分岐（`undefined` → `null`、数値かつ `>0` → 数値、それ以外 → `notFound()`）の単体テストを足す（直接テストが難しければ、実画面確認に `?draftTaskId=abc` を加える）
- [ ] `useUnitSelection(initialIds = [])` の単体テストを1件足す(`initialIds` が反映される、省略時は `[]`)。共通フックの変更を含むことを PR 説明に書く
- [ ] (別コミット)`reset` と `setSelectedUnitIds` の `useEffect` を削除し、`defaultValues` と `useUnitSelection(initialIds)` に一本化する。回帰防止のテストが緑のまま

## 完了条件

- [ ] 下書きの取得に失敗したとき、空のフォームではなく、エラー表示と再試行が出る。401 は `/login` に遷移する
- [ ] 新規作成(`draftTaskId` なし)では、下書きの取得が行われず、これまでどおり動く
- [ ] 下書きがあるときの初期値(タイトル・内容・期限・単元。優先度は範囲外)が、変更の前後で同じ(回帰防止のテストが緑)
- [ ] `CreateTask` と `CreateTaskConfirm` から `useFetchDraftTask` への参照が無く、`useFetchDraftTask.ts` が削除されている(`grep` で確かめる)
- [ ] `reset` の `useEffect` と `setSelectedUnitIds` の `useEffect` が無く、初期値の流し込みが `defaultValues` と `useUnitSelection(initialIds)` に集まっている(単元の二重管理は残る。範囲外)
- [ ] 実画面での確認(確認画面から「キャンセル」で戻る、ネットワーク遮断、新規作成、`draftTaskId` を変えての遷移)を行い、結果を PR 説明に書く。**行わない場合は、「未検証」と PR 説明に明記する**(この2択のどちらか)
- [ ] `useDefaultValues` が `toPriorityValue`（TSK-225 の成果）を使っている（`reset` の一本化で変換が失われないため）。TSK-225 が未マージの場合は、そのマージ後に確認する
- [ ] API の `priority` の実際の型を curl 等で確かめ、結果を PR 説明に書く（別チケットの根拠）。優先度の不具合は TSK-225 で扱う
- [ ] `npm run test` / `lint` / `format:check` / `typecheck` が通る

## 依存

- TSK-223(CreateTaskConfirm)のマージ。TSK-225(優先度の不具合)は独立してマージできるが、`useDefaultValues` が `toPriorityValue` を使う確認は TSK-225 のマージ後。`useFetchDraftTask` の利用者が `CreateTask` だけになり、`DraftTaskType` が `types.ts` に移り、`useDefaultValues.ts` などの import が直るため
- 「データ取得画面の表示分岐を共通化する AsyncBoundary コンポーネントを追加する」「取得状態を一元管理する useApiQuery フックを追加する」(マージ済み)
- TSK-216 が未マージなら、マージ時に許可リストから外すことを TSK-216 側にコメントする(マージ済みなら外す)。これは完了条件ではなく、依存の確認事項
