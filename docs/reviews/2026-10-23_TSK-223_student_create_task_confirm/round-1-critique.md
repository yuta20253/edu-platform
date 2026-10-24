# 批判：student 配下の残りのクライアント画面(EditGoal / EditTask / Calendar / CreateTaskConfirm)の移行（第1周）

## 総評
CreateTaskConfirm の「失敗が黙殺され、空欄の確認画面が出る」問題は実害のある不具合で、これを直す価値は高いです。一方、残り3画面は利用者への効果がほぼ無く、1チケットに束ねたせいで価値の高い部分が TSK-219 待ちに引きずられます。

## 判定
直せば進めてよい。ただし4画面を分割する前提で、CreateTaskConfirm を先頭に独立させます。

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒） | CreateTaskConfirm: 取得失敗時にエラー表示と再試行が出る。空欄の画面で「登録する」を押しても何も起きない状態が無くなる。これは実害のある改善です。 | EditGoal / EditTask / Calendar のローディングは `100vh` の中央から `minHeight: 240` に縮み、描画後のレイアウトが動く。EditGoal / EditTask の `Alert` は `ErrorState` の見た目に変わる。草案は「利用者に見える変化」に書いているが、メリットとしては書いていない。 |
| 開発チーム | 取得状態の分岐が共通部品に揃う。TSK-216 の許可リストから4画面を外せる。`useFetchGoal` / `useFetchDraftTask` と、そのテスト2本を削除できる。 | CreateTaskConfirm では2つの取得を合成する新しい書き方が1つ増える。EditGoal / EditTask は TSK-219 のマージ待ちで、依存が1本増える。 |

- 両方にメリットがあるか：**CreateTaskConfirm は「ある」**。**EditGoal / EditTask / Calendar は「利用者に損がない内部整理」と言い切れない**。スピナーの高さが縮むのは、小さいが利用者に見える後退です。
- やらないことのデメリット：
  - 利用者が失うもの：CreateTaskConfirm の失敗の黙殺が残る。他の3画面は、すでに再試行や `ErrorState` があるので、失うものはほぼ無い。
  - 開発チームが失うもの：TSK-216 の許可リストに4画面が残り続ける。ただし Calendar と EditGoal / EditTask は動作として困っていない。
- 草案に無かったメリット・デメリット：
  - 草案に無いメリット：CreateTaskConfirm の失敗黙殺は不具合の修正であり、他の3画面とは性質が違う。
  - 草案に無いデメリット：スピナーの高さが `100vh` から `240` に縮むと、フォーム画面ではスピナーから本体への切り替えで画面が大きく動く。404 でも「再試行」が出る点も、現状維持とはいえ意味が薄い。

## 確かめた事実
- `CreateTaskConfirm/useFetchGoal.ts` と `useFetchDraftTask.ts` は、`catch` で `console.error` のみ。草案どおり。
- `CreateTaskConfirm/index.tsx` では `if (!draftTask) return` となっており、草案どおり。
- `page.tsx` は `Number(draft_task_id)` なので、クエリが無いと `NaN` になる。草案どおり。
- EditGoal / EditTask の404出し分けも草案どおり。EditGoal の `fetchError` は文字列です。
- Calendar の `!month || !today` は取得状態ではなく、ハイドレーション対策のゲートです（`useCalendar` のコメントで確認）。
- Calendar の `useCalendar` は `setEvents([])` で月ごとにイベントを消す。草案の案Cの理由は事実。
- `useApiQuery` は `error: boolean` のみで、`errorStatus` は無い。
- `/api/student/draft-tasks/NaN` は、BFF の `draftTaskId` をそのまま Rails に渡す作りです（`app/api/student/draft-tasks/[draftTaskId]/route.ts`）。Rails 側は `resources :draft_tasks` で、Rails のコントローラーは見つけていません。バックエンドが404を返すか400を返すかは**未確認**です。草案も「未検証」としています。
- **草案との食い違い**：「やること」に「削除したフックのテストを整理する」とあるが、**EditGoal / EditTask の `useFetchGoal` / `useFetchTask`（`hooks/` 配下）が削除対象かは、草案に明記されていない**。`useFetchTask.test.ts` は存在します。

## 残すべき強み
- 画面ごとの現状（Calendar はすでに `ErrorState` あり、CreateTaskConfirm は黙殺）を区別して調べている。
- 404文言を捨てる案Aを退けている点。
- Calendar を `useApiQuery` に載せない理由（`keepPreviousData` との不整合）が具体的。
- 案Eを自分で「要検討」に挙げている点。
- 「Red になる画面と回帰防止を区別する」とテストの性質を意識している点。

## 指摘（重要な順）

### 指摘1【重要】（観点：スコープと依存の切り方／代替案の比較）案Eは「分ける」で決めるべき
- 何が問題か：価値の中心は CreateTaskConfirm（不具合修正）だけです。それが、価値の薄い EditGoal / EditTask（TSK-219 待ち）と Calendar に束ねられ、マージ待ちの連鎖に巻き込まれます。TSK-213/#204 と TSK-217 で当たった教訓と同じ型です。
- 根拠：草案「依存」の節で、TSK-219 を必須としているのは EditGoal / EditTask だけ。CreateTaskConfirm と Calendar は TSK-219 に依存しない。
- 直し方の提案：次の2つに分ける。
  - チケットA：CreateTaskConfirm（不具合修正として単独で出す）。
  - チケットB：EditGoal / EditTask（TSK-219 後）。
  - Calendar はどちらにも入れない。指摘3を参照。

### 指摘2【重要】（観点：失敗の想定／セキュリティ・入力検証）`NaN` を「取得して失敗させる」は雑
- 何が問題か：
  - 不正な ID では、意味のない `/api/student/draft-tasks/NaN` が飛ぶ。そのうえ、エラー画面に「再試行」が出てしまう。再試行しても直らない状況です。
  - 草案は「ステータスに依らずエラー表示になる」としていますが、これはバックエンドが5xxを返す場合も含みます。つまり不正入力と障害を区別しません。
  - `useApiQuery` には取得をスキップする仕組みがありません。
  - `goalId` が `NaN` の場合は草案に書かれていません。
- 根拠：`page.tsx` の `Number(...)`、現行フックの `if (!goalId) return`（`NaN` は falsy で取得しない）。
- 直し方の提案：
  - `page.tsx` で `Number.isInteger` を確かめ、不正なら `notFound()` を呼ぶ（draft_task_id が無い・数値でない場合も同様）。`goalId` も同様に扱う。
  - この修正なら `useApiQuery` を拡張する必要がない。
  - 「`NaN` のときに `notFound()`」のテストを、`page.tsx` 側に書く。
  - 草案の未検証前提（バックエンドの返すステータス）は、この方法なら確かめる必要自体が消える。

### 指摘3【重要】（観点：共通化の方針・規約との整合／利用者メリット）Calendar の `AsyncBoundary` 化は、取得状態ではないものの流用で、価値も無い
- 何が問題か：
  - `!month || !today` は「ブラウザで日付が決まるまでの待ち」で、取得状態ではありません。`data={month&&today ? … : null}` と偽装するのは、TSK-217 で指摘された「規約の状態を別の意味に流用」にあたります。
  - エラー処理はすでに `ErrorState` で、利用者に見える改善は無い。むしろ `100vh` → `240` で後退する。
  - サーバー描画（`role="progressbar"`）の保持は、`index.ssr.test.tsx` が守るので技術的には可能ですが、それ自体が目的ではない。
- 根拠：`Calendar/index.tsx`、`useCalendar.ts` のコメント。
- 直し方の提案：
  - Calendar は今回のスコープから外す。
  - TSK-216 の許可リストに「ハイドレーション待ちのスピナー」として理由付きで残す。または走査テストでこのパターンを除外する。
  - どうしても外すなら、`minHeight` を維持するか、`100vh` を保つ `fallback` に `ReactElement` を渡す。ただし、この変更に価値があるかを先に示すこと。
  - 判断はオーナー。後述の問い1を参照。

### 指摘4【重要】（観点：設計の具体性）CreateTaskConfirm の合成設計に決めるべき点が残っている
- 何が問題か：
  - `AsyncBoundary` は `data` を1つしか受け取らない。2つの取得を合成するなら、`data={goal && draftTask ? {goal, draftTask} : null}` と `error={goalError || draftError}` を作ることになる。ここは草案で明記されていない。
  - `handleRegister`、`useRegisterTask`、`snackbar` の `useState` は、`draftTask` が確定してから使うのが自然です。`QuestionBody`（直近のコミット）のように内側のコンポーネントに分けるのか、外に残すのかを決める必要がある。
  - 一方が成功し、もう一方が失敗した場合、再試行で両方を取り直す（成功側も再取得）。草案は「両方を取り直す」と書いていますが、成功側が一瞬スピナーに戻らないかなど、挙動を確かめていない。`useApiQuery` は再取得中に data を残すので、おそらく問題ない（推測。テストで確かめる）。
  - ローディング時、Backdrop は全画面でしたが、`spinner`（`minHeight: 240`）に変わる。確認画面の骨格（2つの `FormSection`）を `card-skeleton` で出すほうが、`Backdrop` に近い体験になる可能性がある。
- 根拠：`AsyncBoundary.tsx` の型、`CreateTaskConfirm/index.tsx`。
- 直し方の提案：「`goal` と `draftTask` を合成する」「`CreateTaskConfirmBody` を内側に分ける」「`fallback` は何か」を草案に明記する。`QuestionBody` の分け方を先例として引く。

### 指摘5【重要】（観点：テスト計画）テストの罠が複数ある
- 何が問題か：
  - 既存の `CreateTaskConfirm/index.test.tsx` は `apiClient.get` を `mockImplementation` で URL 判定しているので、そのまま通る可能性が高い。これは Red ではなく回帰防止です。真の Red は「失敗時にエラー表示が出る」「`NaN` で `notFound` 相当になる」だけ。草案の「現行で Red になる画面と回帰防止を区別する」を、具体的に書き分ける。
  - 片方だけ失敗のテストは、`mockImplementation` の URL 分岐で作る。`mockRejectedValueOnce` を使うと次のテストに漏れる（TSK-212 の教訓）。「再試行 → 成功」は、`mockRejectedValueOnce` ではなく呼び出し回数で分岐する実装が安全。
  - 実画面確認が計画にない（TSK-217 の教訓）。特に、CreateTaskConfirm の「新規タスク作成 → 確認 → 登録」の遷移と、`draft_task_id` なしで直接開いたとき。
  - 401 テストは、`useApiQuery` 経由なので `router.push("/login")` を確かめる。
- 直し方の提案：テスト計画に「Red 一覧」「回帰防止一覧」「実画面確認（失敗は DevTools のネットワーク遮断で再現）」を分けて書く。

### 指摘6【軽微】（観点：完了条件）完了条件が測りにくい
- 何が問題か：「分岐の直書きが残っていない」は grep で測れる形にすべきです。「TSK-216 の許可リストから外せる」は、TSK-216 が未マージなら確かめられない。
- 直し方の提案：「`index.tsx` に `CircularProgress` の import が無い」を条件にし、許可リストの件は TSK-216 のマージ後に確認する旨を書く。分割後は、チケットAの条件に「失敗時にエラー表示と再試行」「不正な ID で `notFound`」を入れる。

### 指摘7【軽微】（観点：利用者メリットの記述）EditGoal / EditTask のメリットを正直に書く
- 何が問題か：ローディングが `100vh` から縮む後退と、404 でも「再試行」が出る点が、メリットとして整理されていない。
- 直し方の提案：チケットBのメリットを「見た目の一貫性とコード削減」と正直に書く。それで足りるか判断し、足りなければ後回しにする。`fallback` を `ReactElement` で渡して `minHeight` を保つ手もある。

## 本人に確認すべき問い
1. Calendar を今回外して、TSK-216 の許可リストに例外として残してよいか。それとも走査テスト側で外すか。
2. EditGoal / EditTask は、利用者への効果がほぼ無いまま TSK-219 を待ってまで今やるべきか。あるいは TSK-219 の完了後に回すか。
3. CreateTaskConfirm の不正 ID は `notFound()` でよいか。それとも `ErrorState` を出したいか。
4. 実画面での失敗再現（ネットワーク遮断、`draft_task_id` なし）に、開発サーバーを使ってよいか。
