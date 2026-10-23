## 概要

`features/student` の取得画面のうち、次の **11画面** の `index.tsx` を `AsyncBoundary`(+ `useApiQuery`)に置き換える。2つの PR に分ける。

- PR 1 一覧系(4画面): Announcements / Goals / Tasks / Interviews
- PR 2 詳細・フォーム系(7画面): AnnouncementDetail / GoalDetail / TaskDetail / Unit / CreateInterview / Question / QuestionConfirmation

当初の対象のうち **Analytics** と **InterviewDetail**、およびチケットの「など」に入っていた **6画面**(EditGoal / EditTask / Calendar / CreateTaskConfirm / UserProfile / EditUserProfile)は、このチケットの範囲外にして別チケットにする(理由は「背景」)。

## 背景(調査結果)

- 当初の対象13画面のうち、範囲内の11画面は、すべて `index.tsx` にローディング・エラーの分岐を直書きしている(範囲外の Analytics と InterviewDetail は、独自の取得処理を持つ)。
- **コード上は、初回描画でエラー(または空)の分岐に入る画面が多い。実画面での見え方(一瞬か、ハイドレーションまで続くか)は未確認。** `loading` の初期値が `false` で、`true` になるのは effect が走った後のため、初回描画は「data なし・loading なし」になる。
  - AnnouncementDetail / GoalDetail / TaskDetail / Unit: `!data || error` に当たり、「データの取得に失敗しました」の分岐に入る
  - Goals / Tasks: 同上(`!data || error`)
  - Question: 「問題が存在しません」の分岐に入る(`questions` の初期値が `[]`)
  - QuestionConfirmation: 「問題履歴がありません」の分岐に入る
  - Announcements / Interviews / CreateInterview は、`!data` でスピナー、または `loading` の初期値が `true` のため、この問題はない
- 取得失敗の文言を直書きしているのは、範囲内で9画面(Announcements / AnnouncementDetail / Goals / GoalDetail / Tasks / TaskDetail / Unit / Question / QuestionConfirmation)。**再試行できる画面は11画面すべてでゼロ**(Interviews と CreateInterview は `ErrorState` を使うが `onRetry` を渡していない)。
- 範囲外にする理由:
  - **Analytics**: オープン中の #206・#199(TSK-206)が `index.tsx`・`useAnalytics`・`Presenter` ごと書き換えている。さらに、条件が揃うまで取得しない作りで、現行の `useApiQuery` では置き換えられない(#206 が `enabled` / `keepPreviousData` を追加する予定だが未マージ)。
  - **InterviewDetail**: 面談とメッセージ(全ページ)を `Promise.all` で取得し、メッセージ送信・キャンセル・409/422 のたびに取り直す。`useApiQuery` は単一 URL の取得を前提にしているため置き換えられない。チケットが範囲外にしている「422 で古い状態が残る件」とも絡む。
  - **EditGoal / EditTask / Calendar / CreateTaskConfirm**: クライアント側で手書きの取得分岐を持つが、チケットの対象一覧(「など」)に含まれていなかった。フォーム(`react-hook-form`)や `useCourses` と取得が絡むため、別に設計する。
  - **UserProfile / EditUserProfile**: async のサーバーコンポーネントで、クライアント用の `AsyncBoundary` / `useApiQuery` は使えない(`getMeFromBackend` が失敗すると、静的なスピナーのまま止まる)。別の方式が必要。

### 検証済みの前提

| 前提                                                                          | 確かめ方                                                                                                | 結果                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 依存の #191・#192 がマージ済み                                                | `gh pr view`                                                                                            | 両方 MERGED(#191: 2026-10-15、#192: 2026-10-18)                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Analytics が別 PR で書き換え中                                                | `gh pr view 206/199 --json files`                                                                       | #206・#199 とも OPEN。`features/student/Analytics/index.tsx` と `hooks/useAnalytics.ts` を変更                                                                                                                                                                                                                                                                                                                                                                   |
| `useApiQuery` に「取得しない」指定がない                                      | `hooks/useApiQuery.ts` を読む                                                                           | 現行は無し。#206 が `enabled` を追加(未マージ)                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `questions` を渡し直しても `useQuestion` が再実行されない                     | `useQuestion.ts` を読む                                                                                 | `questions` は件数と添字にだけ使われ、effect の依存は `currentQuestion?.id` のみ                                                                                                                                                                                                                                                                                                                                                                                 |
| 確認画面の `answeredQuestionIds` の配列が毎回作り直されても無限に再取得しない | page.tsx と `useApiQuery` を読む                                                                        | page.tsx は async のサーバーコンポーネントで、配列はサーバー側で作られて props で渡る。従来のフックでも無限再取得は起きていなかった。`useApiQuery` は params を `JSON.stringify` した値で比較するので、今後も安全                                                                                                                                                                                                                                                |
| 初回描画でエラー・空の分岐に入る                                              | 各フックの `useState` の初期値と `index.tsx` の分岐を読む                                               | 上の「背景」のとおり。**コード上の確認で、実画面では未確認**                                                                                                                                                                                                                                                                                                                                                                                                     |
| 範囲外の画面が他にもある                                                      | `features/student` の `index.tsx` から `CircularProgress` / `ErrorState` / `データの取得に失敗` を grep | Calendar / CreateTaskConfirm / EditGoal / EditTask / EditUserProfile / UserProfile が該当                                                                                                                                                                                                                                                                                                                                                                        |
| student の詳細系ルートが動的セグメントの下にある                              | `app/(main)/(authenticated)/` の `page.tsx` を列挙                                                      | `announcements/[announcementId]`、`goals/[goalId]`、`tasks/[taskId]`、`goals/[goalId]/tasks/[taskId]/units/[unitId]/questions` など、対象の詳細系はすべて動的セグメントの下にある(確認できたのはルートの構造まで)。TSK-217 の実画面確認(2026-10-21、`docs/reviews/README.md`)では、動的セグメントが変わると App Router がページを作り直し、state は残らなかった。**student でも同じ挙動かは、構造が同じというコード上の推論で、実画面では未確認 → 下の未検証表** |

### 未検証の前提

| 前提                                                                                                                                                                                                                                            | 確かめる方法                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (2026-10-23 のオーナーの判断: 実装時、PR 2 の着手前に了承を得て行う) student の詳細系ルートでも、ID が変わる遷移でページが作り直され、前の内容が残らない(構造は TSK-217 と同じだが、student では実画面で未確認)                                 | 実画面で `router.push` とブラウザの戻るを試す(開発サーバーとログイン用の生徒アカウントが要る。オーナーの了承を得てから)。**確認できないまま PR 2 を出す場合の保険**: PR 2 の説明に「未検証」と明記し、前の内容が残ると分かったら、その画面だけ `key={id}` を付ける追補 PR を出す |
| 「初回にエラー/空の表示が出る」が、実画面でどのくらいの長さ見えているか。`"use client"` のコンポーネントも SSR されるため、初期 HTML にエラー文言が含まれ、ハイドレーションと effect が走るまで見える可能性がある(「一瞬」より長いかもしれない) | ログイン済みの生徒の Cookie で `curl` し、SSR の HTML に「データの取得に失敗しました」が含まれるか確かめる。あわせて実画面でネットワークを遅くして確認する(開発サーバーと生徒アカウントが要るので、オーナーの了承を得てから)。メリットの書き方は、この実測まで断定しない         |
| ローディング表示を共通のスピナー(`minHeight: 240`)にしたとき、画面中央(`100vh`)から上寄りに見た目が変わるが、許容範囲か                                                                                                                         | 実画面のスクリーンショットで比べ、オーナーに確認する                                                                                                                                                                                                                             |

## 設計

### 利用者に見える挙動の変化(デメリット)

- **ローディングの見た目**: 画面中央(`100vh`)から、共通のスピナー(`minHeight: 240`)に変わる。Question や確認画面では上寄りに見える。
- **Goals の再取得中の表示**: 現行は、ページ切替・削除後の再取得のたびに画面全体がスピナーに置き換わる(コードで確認: `setLoading(true)` の後、`index.tsx` が `if (loading)` を先に判定する)。移行後は前のリストが残り、スピナーは出ない。遅い回線では、クリックしても何も起きないように見える間ができる。削除後は、削除済みの目標が一覧に残る間ができる。規約3(再取得中は前回の data を残す)に沿った挙動だが、利用者には変化として見える。
- **失敗後の再試行の中間表示**: 現行の Goals / Tasks / Interviews は、失敗すると `setData(null)` で data を消す。`useApiQuery` は失敗しても data を残すので、「成功 → 失敗 → 再試行」のとき、再試行が終わるまで失敗の前のリストが表示される。Tasks / Interviews では、status を切り替えて失敗したあとの再試行で、前の status のリストが見える間ができる(エラー表示そのものは `AsyncBoundary` が error を先に判定するので正しく出る)。teacher・admin の移行済み画面と同じ挙動。
- **変わらない画面**: Announcements(`loading` を持たず data を残す)、Interviews(`!data` でスピナー)、Tasks(`loading && !data`)は、現行でも再取得中に前の data を残すので変わらない(コードで確認)。
- これらを許容するか、判断するのはオーナー。**2026-10-23 に、teacher・admin の移行済み画面と同じ扱いとして許容すると決めた。** 最終確認は、PR 説明に書く移行前後の様子(Goals は挙動の説明、ローディングは画面の比較)を見てオーナーが行う。

### 全体の方針

- 各画面のデータ取得を `useApiQuery` に置き換え、`index.tsx` は `AsyncBoundary` で包む。`fallback` は既定のスピナーのままにして、**見た目の変更を最小にする**(スケルトン化は別の話)。
- **フックの残し方(TSK-214 で決めた基準を踏襲)**: ページ・フィルタの state を持つ画面はフックを残す。URL を組み立てて `useApiQuery` を呼ぶだけの画面は、フックを作らず `index.tsx` で直接呼ぶ(自画面からしか呼ばれない2行のフックを増やさない)。
- 取得中の abort・401 のリダイレクトは `useApiQuery` 側で検証済み。フックのテストは、残したフックの `data` / `error` / パラメータだけに絞る。`index.test.tsx` を各画面に追加する。
- `hooks/useApiQuery.ts` と `AsyncBoundary` は**変更しない**(#206 と衝突させない)。

### 画面ごとの変更

| 画面                 | PR  | フック                              | 変更点                                                                                                                          |
| -------------------- | --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Announcements        | 1   | `useGetAnnouncements` を残す        | `useApiQuery` に置換(page を持つ)。`refetch` を返す                                                                             |
| Goals                | 1   | `hooks.ts` の `useGetGoals` を置換  | `useDeleteGoal({ onDeleted: refetch })` は変更しない。再取得中に前のリストが残る(上の「利用者に見える挙動の変化」)              |
| Tasks                | 1   | `useGetTasks` を置換                | page・status を持つ。`setStatus` で page を 1 に戻す。status が `active` のときは `status` パラメータを付けない(今の動作どおり) |
| Interviews           | 1   | `useGetInterviews` を置換           | 既に `ErrorState` を使うが `onRetry` が無かったので再試行を付ける。status が `all` のときは `status` を付けない                 |
| AnnouncementDetail   | 2   | `useGetAnnouncement` を削除         | `index.tsx` で直接 `useApiQuery`                                                                                                |
| GoalDetail           | 2   | `hooks.ts` の `useGoal` を削除      | `useDeleteGoal` は残す                                                                                                          |
| TaskDetail           | 2   | `hooks.ts` ごと削除                 | `index.tsx` で直接 `useApiQuery`                                                                                                |
| Unit                 | 2   | `useGetUnit` を削除                 | `useStartStudyLog` は残す                                                                                                       |
| CreateInterview      | 2   | `useGetTeachers` を削除             | レスポンスは `{ teachers }`。`errorMessage="先生の一覧を取得できませんでした"` を維持する                                       |
| Question             | 2   | `useGetQuestions` を削除            | 下記                                                                                                                            |
| QuestionConfirmation | 2   | `useGetQuestionConfirmation` を削除 | 下記                                                                                                                            |

### Question

- 外側の `Question` は `useApiQuery` と `AsyncBoundary` だけにする。`AsyncBoundary` の子として内側の `QuestionBody` を描画し、そこで `useQuestion({ questions })` を呼ぶ。`questions` は常に配列(取得完了後)なので、`data ?? []` のような回避策も、毎回新しい配列を作る心配も要らない。`useQuestion` の状態は取得完了後にしか生まれない。
- `QuestionBody` の中で、`currentQuestion` が無ければ「問題が存在しません」、`hasError` なら「回答の送信に失敗しました」を表示する。この2つは**取得状態ではない**ので、今の表示を維持する。
- これで、取得前に `questions` が `[]` として扱われ「問題が存在しません」が出る問題が直る。
- 成功後に `refetch` を呼ぶ契機(送信後の取り直しなど)を作らない。`refetch` は `AsyncBoundary` の `onRetry` にだけ渡す。再取得で `questions` が差し替わり `currentIndex` がずれる心配を作らないため。失敗 → 再試行 → 成功のときは `QuestionBody` が新しく作られ、`currentIndex` は 0 から始まる。

### QuestionConfirmation

- `params: { answered_question_ids: ids?.join(",") }` で `useApiQuery` を呼ぶ。`useCompleteStudyLog` は取得と独立しているので変更しない。
- 履歴が 0 件のときの「問題履歴がありません」は、`AsyncBoundary` の子の中で `data.length === 0` として判定する(`[]` は有効な data として扱われる)。

### CLAUDE.md(PR 1)

`frontend/CLAUDE.md` の「実装の参考: `features/student/Interviews`(…再試行は未対応)」は、Interviews を移行する PR 1 のマージで古くなる。参考先を移行後の画面(`features/student/Tasks`)に直す。良い例のコードの書き換えは TSK-216 の範囲。

## 比較した案

| 案                                                                      | 採否         | 理由                                                                                                                                                               |
| ----------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A: チケットどおり13画面を1つのチケットで                                | 不採用       | Analytics は #206・#199 のマージ待ち、InterviewDetail は `useApiQuery` の拡張が要る。待っている間、残りの画面が進まない                                            |
| B: InterviewDetail は面談だけ `useApiQuery`、メッセージは別フックのまま | 不採用       | 2つの取得状態を合成することになり、送信・キャンセル後の取り直しと 409/422 の扱いが複雑になる。取得処理の拡張(任意の取得関数を渡せる形)を先に設計するほうが筋がよい |
| C: 2行のフックを残す(`useGetAnnouncement` など)                         | 不採用       | 自画面の `index.tsx` からしか呼ばれない。TSK-214 でも同じ理由で削除した                                                                                            |
| D: ローディングを要素の `fallback` で `100vh` のまま維持                | 不採用       | `index.tsx` に `Box` + `CircularProgress` を残すことになり、TSK-216 の走査テストと ESLint に違反する                                                               |
| D2: Question だけ要素の `fallback` で `100vh` を維持                    | 不採用(保留) | 見た目は保てるが、`index.tsx` に例外が残り TSK-216 の走査で許可リストが要る。実画面で許容できないと分かった場合に再検討する                                        |
| E: 一覧系をスケルトン表示にする(規約5の表どおり)                        | 不採用       | 見た目を変える別件。今回は既定のスピナーのまま移行し、表の割り当ては TSK-216 で確定する                                                                            |
| G: Question を外側で `useQuestion({ questions: data ?? EMPTY })` と呼ぶ | 不採用       | `AsyncBoundary` の外に「取得前の空配列の state」が残り、`EMPTY` 定数が回避策になる。内側のコンポーネントに分けるほうが、取得前の状態が消えて読みやすい             |
| F: 範囲外の6画面も今回やる                                              | 不採用       | サーバーコンポーネント2つは方式から検討が要る。フォーム系4つは `react-hook-form` / `useCourses` との絡みがあり、PR が大きくなりすぎる                              |

## やること

### 範囲外の画面を別チケットにする(着手前)

- [ ] Analytics(#206・#199 のマージ後。`useApiQuery` の `enabled` / `keepPreviousData` を使う)
- [ ] InterviewDetail(`useApiQuery` に取得関数を渡せる拡張を先に検討する)
- [ ] EditGoal / EditTask / Calendar / CreateTaskConfirm(クライアント側のフォーム・カレンダー系)
- [ ] UserProfile / EditUserProfile(サーバーコンポーネントの取得失敗の表示)
- [ ] (2026-10-23 にオーナーが許可リスト方式に決定)TSK-216 は、これらの別チケットの完了を待たない。**走査テストと ESLint に一時的な許可リスト**(範囲外画面を列挙し、別チケットが消化されるたびに外す)を持たせる。新しい画面への直書きを止める価値を、残りの移行より先に得るため
- [ ] 各別チケットに「生徒にとって何が良くなるか」を1行書く
  - Analytics: 絞り込みを切り替えても、失敗時に再試行できる(#206・#199 の後)
  - InterviewDetail: 取得失敗と、422 後に古い状態が残る問題を直せる
  - EditGoal / EditTask / Calendar / CreateTaskConfirm: 取得失敗の見え方がそろい、再試行できるようになる(CreateTaskConfirm は取得失敗時の表示の有無を、着手時に確かめる)
  - UserProfile / EditUserProfile: プロフィールの取得に失敗したとき、静的なスピナーのまま止まらず、エラーを表示できる(実害があるので優先度を上げる)

### PR 1: 一覧系

- [ ] Announcements / Goals / Tasks / Interviews を置き換える
- [ ] 各画面に `index.test.tsx` を追加する: 取得中はスピナー、成功で表示、失敗で `alert` と再試行、401 で `/login`
- [ ] **初回描画のテスト**(API を保留にしたまま、`alert` が出ず `progressbar` が出ることの両方を判定する)
  - Goals / Tasks: 現行コードでは `!data || error` に入って Red になる。**実装前にテストだけを書いて落ちるのを確認してからコミットする**
  - Announcements / Interviews: 現行でも `!data` でスピナーを出すので Red にならない。「回帰防止」と明記して区別する
- [ ] Tasks / Interviews / Announcements / Goals: ページ・status を切り替えても前の画面が残る(`progressbar` が出ない)
- [ ] Tasks / Interviews: status を切り替えると page が 1 に戻り、`status` パラメータが正しく付く
- [ ] Tasks / Interviews: 成功 → 失敗 → 再試行の中間状態(再試行が終わるまで前のリストが残る)を1本確認し、期待する挙動として固定する
- [ ] 残したフックのテストを更新する(abort 系を外し、`data` / `error` / パラメータに絞る)
- [ ] `frontend/CLAUDE.md` の「実装の参考」の行を直す(参考先を移行後の `features/student/Tasks` に)。#207 も同じファイルを変更するので、マージ順に注意し、最新の main から差分だけ当てる。衝突したら参考先の差し替えだけにする

### PR 2: 詳細・フォーム系

- [ ] AnnouncementDetail / GoalDetail / TaskDetail / Unit / CreateInterview / Question / QuestionConfirmation を置き換える
- [ ] 各画面に `index.test.tsx` を追加する(上と同じ観点)。初回描画のテストは、AnnouncementDetail / GoalDetail / TaskDetail / Unit / Question / QuestionConfirmation で **Red を確認してからコミットする**(CreateInterview は `loading` の初期値が `true` のため Red にならない。回帰防止と明記する)
- [ ] Question: 初回描画で「問題が存在しません」が出ない / 取得後に 0 件なら出る / 回答の送信失敗の表示は今のまま / 失敗 → 再試行 → 成功のあと、最初の問題から始まる(`QuestionBody` を分けた意図を固定する)
- [ ] QuestionConfirmation: 初回描画で「問題履歴がありません」が出ない / 0 件なら出る / `answered_question_ids` が params に付く / 同じ内容の配列を渡し直しても再取得しない(実装前から通るので、Red にならない回帰防止)
- [ ] CreateInterview: 失敗時に `errorMessage` の文言が出る
- [ ] 削除したフックのテストを消し、残したフック(`useDeleteGoal` / `useStartStudyLog` など)のテストが通ることを確認する

## 完了条件

- [ ] 対象11画面の `index.tsx` に、**取得状態(ローディング・取得失敗)の分岐の直書きが残っていない**(`CircularProgress` の import と「データの取得に失敗しました」の直書きが無い)
  - 取得状態ではない表示(0 件のメッセージ、回答の送信失敗)は対象外
- [ ] 11画面すべてで、取得に失敗するとエラー表示と再試行ができる
- [ ] 初回表示でエラーや空の表示が出ない
  - 単体テストで確認する(上の「初回描画のテスト」)
  - 実画面での確認(Goals / Question と、詳細系の ID が変わる遷移)は、オーナーの了承が得られた場合に行い、結果を PR 説明に書く。行わなかった場合は、「未検証」と明記する
- [ ] PR 説明に、利用者に見える挙動の変化(ローディングの見た目、Goals の再取得中の表示)の移行前後の様子を添え、オーナーが許容を判断する(画像は実画面の起動が要るため、オーナーの了承が前提。無い場合は文章で説明する)
- [ ] 401 のときは `/login` に遷移し、エラーを表示しない
- [ ] `npm run test` / `lint` / `format:check` / `typecheck` が通る
- [ ] 範囲外にした画面の別チケットが作られ、TSK-216 の許可リストに列挙されている

## 依存

- 「データ取得画面の表示分岐を共通化する AsyncBoundary コンポーネントを追加する」(マージ済み)
- 「取得状態を一元管理する useApiQuery フックを追加する」(マージ済み)
- #191・#192 のマージ(済み)
- 範囲外にした画面の別チケットの完了を、TSK-216 は待たない(許可リスト方式)
- #206・#199 とは依存しない(Analytics を範囲外にしたため。`hooks/useApiQuery.ts` も変更しない)
