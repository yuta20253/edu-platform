## 概要

移行後にローディング・エラー表示の直書きが再び入り込まないよう、禁止事項を **ESLint(`npm run lint`、CI で実行)と `frontend/CLAUDE.md`** で守る。

元の草案(2026-10-18)は「CLAUDE.md + 走査テスト + ESLint」の 3 本立てで、許可リストを走査テストと ESLint の両方に持つ前提だった。2026-11-04 の main(`2c40894b`)を調べ直したところ、**前提が 3 点ずれていた**ので、設計を見直した(「背景」を参照)。

## 背景(調査結果)

- 着手条件は満たされた。移行チケット(TSK-221〜226、Analytics)はすべてマージ済みで、Analytics の `index.tsx` に手書きのローディング・エラー分岐は無い。
- `features/**/index.tsx` は 64 本。うち 45 本が `AsyncBoundary` を使っている。
- **元の許可リストは、すべて消化済み**(InterviewDetail・UserProfile・EditUserProfile・CreateTaskConfirm・CreateTask・EditGoal・EditTask)。許可リストは空から始められる。
- 一方、`index.tsx` に `CircularProgress` が残るのは次の 4 本で、**うち 3 本は元の許可リストに載っていない**。

| 画面                        | 残っている手書き                                                                                                         | 性質                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `student/Calendar`          | `!month \|\| !today` のとき `CircularProgress`                                                                           | 取得状態ではなく、ブラウザで日付が決まるまでの待ち(ハイドレーションエラーの回避。`useCalendar` のコメントに理由あり)。恒久的な例外                         |
| `teacher/InterviewCalendar` | 同上(`index.tsx` の差は名前と `height` だけ)                                                                             | 元の許可リストに無い。`useInterviewCalendar.ts` にも同じ理由のコメントがあり、`student/Calendar` と同じ恒久的な例外                                        |
| `teacher/CreateInterview`   | `!ready` のとき `CircularProgress`                                                                                       | 初期選択の生徒が決まるまでの待ち。取得に失敗してもエラーにせず、未選択のままフォームを出す設計(`useInitialStudent` のコメントに明記)。元の許可リストに無い |
| `teacher/CreateStudent`     | `CircularProgress` と、手書きの `<Alert severity="error">教員情報の取得に失敗しました。再読み込みしてください。</Alert>` | **本物の違反**。手書きの取得フック(`useCurrentTeacher`)で、再試行ボタンも無い。元の許可リストに無く、移行チケットも無い                                    |

- **「取得に失敗しました」の文字列を禁止する案は、そのままだと推奨パターンを誤検出する。** `AsyncBoundary` の `errorMessage` に具体的な文言を渡すのが採用済みのパターンで、`EditGoal`・`EditTask`・`admin/NoticeEdit`・`teacher/AnnouncementEditor`・`admin/Schools`(トースト)の 5 本が `index.tsx` に文字列リテラルで持っている(TSK-224 の #233 も同じ)。
- **`CircularProgress` の禁止を `features/**/\*.tsx` に広げることはできない。** 広げると 22 ファイルが引っかかり、`index.tsx` の 4 本以外の 18 本は、送信ボタンの「処理中」スピナー(Drawer・Step・Presenter など)で、正当な使い方。ローディング分岐を Presenter へ移す逃げ道は残るが、機械では区別できない。
- 元の禁止事項は 4 つだが、走査テストと ESLint が検出できるのは 2 つ(`CircularProgress` の import と、エラー文言の直書き)だけ。`loading || !data` と「401 以外の握りつぶし」は、どちらにも検出する仕組みが書かれていない(このうち `loading` の分岐は、試したところ `index.tsx` に 0 件で、機械化できる)。
- `eslint.config.mjs` にはカスタムルールが無い(ESLint 8.57.1、flat config)。既存の走査テストは `features/admin/noHardcodedColors.test.ts` の 1 本だけ。CI(`frontend-ci.yml`)は `npm run lint` を実行する。
- `frontend/CLAUDE.md` は、規約5の割り当て表が「案。`AsyncBoundary` の PR レビューで確定する」のまま、「既存画面の移行は別チケットで行う」も移行が終わった今は古い。良い例は `CircularProgress` を直接使っている(禁止事項に自分で違反する)。

### 検証済みの前提

| 前提                                                                                                                                                                                                                                        | 確かめ方                                                                                                                                                                                                                                           | 結果                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `index.tsx` で `CircularProgress` が残るのは 4 本                                                                                                                                                                                           | `grep` と、提案どおりの `no-restricted-imports` を一時設定で `eslint` に当てた(2026-11-04。設定ファイルは削除済み)                                                                                                                                 | `student/Calendar`・`teacher/InterviewCalendar`・`teacher/CreateInterview`・`teacher/CreateStudent` の 4 本。一致        |
| `no-restricted-imports` は `@mui/material` の名前付き import と `@mui/material/CircularProgress` の個別 import の両方を検出できる                                                                                                           | 両方の形で書いた使い捨てファイルに `eslint` を当てた                                                                                                                                                                                               | 両方検出できた(別名 import の `CircularProgress as CP` も検出)                                                           |
| 文字列リテラルの禁止(`Literal[value=/取得に失敗/]`)は、推奨パターンを誤検出する                                                                                                                                                             | 一時設定で `features/**/index.tsx` に当てた                                                                                                                                                                                                        | 5 本(`NoticeEdit`・`Schools`・`EditGoal`・`EditTask`・`AnnouncementEditor`)が引っかかった。いずれも規約どおり            |
| JSX のテキスト(`JSXText[value=/取得に失敗/]`)だけを禁止すれば、手書きの失敗表示だけを検出できる                                                                                                                                             | 同上                                                                                                                                                                                                                                               | `teacher/CreateStudent` の 1 本だけ                                                                                      |
| `Alert` の `severity="error"` を禁止するのは広すぎる                                                                                                                                                                                        | 同上                                                                                                                                                                                                                                               | `Login`・`SignUp`(フォームの入力エラー表示。正当)も引っかかる。採用しない                                                |
| 不要になった `eslint-disable` を、ESLint が検出できる(`linterOptions.reportUnusedDisableDirectives: "error"`)                                                                                                                               | 違反の無いファイルに `eslint-disable` を付けた使い捨てファイルに `eslint` を当てた                                                                                                                                                                 | `Unused eslint-disable directive` でエラーになった。実際の違反に付けたものは通る                                         |
| `reportUnusedDisableDirectives: "error"` を有効にしても、現在の main の `npm run lint` は通る                                                                                                                                               | プロジェクト全体に一時設定で当てた                                                                                                                                                                                                                 | 不要な `eslint-disable` は 0 件。既存の `eslint-disable` は 3 件で、いずれも使われている                                 |
| `student/Calendar` の `!month \|\| !today` は、ハイドレーション待ち                                                                                                                                                                         | `useCalendar.ts` のコメントを読む                                                                                                                                                                                                                  | 「サーバー(UTC)とブラウザ(JST)で日付がずれるとハイドレーションエラーになるため、サーバー描画では null のまま」と明記     |
| `CreateInterview` のスピナーは、エラーを出さない設計の一部                                                                                                                                                                                  | `useInitialStudent.ts` のコメントを読む                                                                                                                                                                                                            | 「取得できない(担当外・削除済みなど)ときは未選択のままフォームを出すため、エラー表示にはしない」と明記                   |
| `teacher/InterviewCalendar` の `!month \|\| !today` も、ハイドレーション待ち                                                                                                                                                                | `useInterviewCalendar.ts` を読む                                                                                                                                                                                                                   | `student/Calendar` と同じコメントがあり、`today`・`month` は `useState(null)`(批判役も確認)                              |
| `CircularProgress` の禁止を `features/**/*.tsx` に広げると、誤検出が増える                                                                                                                                                                  | 一時設定で `features/**/*.tsx`(テスト除く)に当てた(2026-11-04)                                                                                                                                                                                     | 22 ファイル。増える 18 本は送信ボタンのスピナー。広げない                                                                |
| `JSXText[value=/取得に失敗/]` を `features/**/*.tsx` に広げた場合の違反は少ない                                                                                                                                                             | 同上                                                                                                                                                                                                                                               | 2 件だけ: `teacher/CreateStudent/index.tsx` と、CLAUDE.md が規約の例外と書いている `teacher/StudentDetail/Presenter.tsx` |
| JSX テキストの違反は、**文言の行ではなく、JSX テキストの開始行(開始タグを閉じる `>` の行)で報告される**。単行タグの `<Alert severity="error">`(`CreateStudent`)では、開始タグの行の直前に `{/* eslint-disable-next-line … */}` を置くと通る | `CreateStudent/index.tsx` に実際に付けて `eslint` を当てた(元に戻した)                                                                                                                                                                             | 文言の直前に置くと「不要な disable」と「違反」の二重エラー。開始タグの行の直前に置くと違反が消えた                       |
| **複数行の開始タグで三項演算子の中にある `StudentDetail/Presenter.tsx` では、違反は `>` の行(120 行)で報告され、`{/* */}` は効かない。タグの中の最後の属性の次の行(`>` の直前)に `// eslint-disable-next-line …` を置くと通る**             | `StudentDetail/Presenter.tsx` に実際に付けて `eslint` を当てた(元に戻した。批判役も別に再現)                                                                                                                                                       | `{error ? (` の前の `{/* */}` は二重エラー。`>` の直前の `//` は通った                                                   |
| 名前が `/[Ll]oading$/` の識別子を、条件の位置(`if` の条件・三項演算子の条件・`&&` の左辺)で使う分岐は、`features/**/index.tsx` に **1 件だけ**(`CreateStudent/index.tsx` の `if (teacherLoading)`)                                          | 条件の位置に限ったセレクタを一時設定で当てた(2026-11-04)。名前を `loading`・`isLoading` の完全一致にした最初の試行は 0 件で、`loading: teacherLoading` とリネームした既知の違反を見逃していた(第 3 周の指摘)                                       | 1 件。`index.tsx` で `loading` が出るのは、他にはフックの戻り値の受け取りと `Presenter` への props の受け渡しだけ        |
| 上のセレクタは、props の受け渡しを誤検出しない                                                                                                                                                                                              | リネームした受け取り・`!loading`・`x \|\| loading`・三項演算子の条件・`loading && …` と、`if` の本体の `<P loading={loading} />`・三項演算子の本体の `<P loading={loading} />`・`cond && <P loading={loading} />` を書いた使い捨てファイルに当てた | 前者の 5 つだけに当たり、後者の 3 つには当たらなかった                                                                   |

### 未検証の前提

| 前提                                                                                                                                                           | 確かめる方法                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint のルールを `files: ["features/**/index.tsx"]` に限定すると、テストファイル(`index.test.tsx`)にも効いてしまわないか                                      | `ignores: ["**/*.test.tsx"]` を足して、実装時にテストで確かめる(使い捨てファイルで確認済みなのは `index.tsx` のみ)                                                                                                                              |
| ESLint の設定のテスト(`ESLint` クラスの `lintText`)が、`vitest` で 2 秒以内に動く                                                                              | 実装の最初に 1 本書いて、実行時間を測る。入れる場合は `overrideConfigFile` で本物の設定を読ませる(設定を複製するとずれる)。2 秒以内なら必須(完了条件に入る)。超えたら、入力と `eslint` の出力を PR 本文に貼り、オーナーが PR レビューで確認する |
| `no-restricted-syntax` を `index.tsx` 用と `*.tsx` 全体用の 2 つの設定ブロックに分けると、後のブロックが同じルールの設定を置き換える(flat config の仕様。推測) | 実装時に、使い捨てファイルで「`index.tsx` では `loading` の分岐と `JSXText` の両方が効く」「`index.tsx` 以外では `JSXText` だけが効く」を確かめる                                                                                               |

## 設計

1. **守る仕組みは ESLint 1 本にする。走査テストは追加しない。**
   - 走査テストが ESLint に加えるものは、「許可リストの消し忘れの検出」と「ESLint を使わない CI」だが、前者は `reportUnusedDisableDirectives: "error"` で ESLint 自身ができ、後者は `frontend-ci.yml` が `npm run lint` を実行しているので要らない。許可リストを 2 か所に持つと、ずれる。
2. **例外は、違反の行に `eslint-disable-next-line <rule> -- <理由>` を付けて書く。** 許可リストのファイルは作らない。
   - 理由は固定の見出しで始める: 恒久は `表示規約の例外(恒久): <理由>`、一時は `表示規約の例外(一時): <チケット番号> で移行予定`。
   - **JSX のテキスト違反は、文言の行ではなく、JSX テキストの開始行(開始タグを閉じる `>` の行)で報告される**(検証済み)。`eslint-disable-next-line` は、報告される行の直前に置く。
     - 単行の開始タグで、子の位置にあるとき(例: `CreateStudent` の `<Alert severity="error">`): 開始タグの行の直前に `{/* eslint-disable-next-line no-restricted-syntax -- … */}`
     - 複数行の開始タグ、または三項演算子の中(例: `StudentDetail/Presenter.tsx`): タグの中の最後の属性の次の行(`>` の直前)に `// eslint-disable-next-line no-restricted-syntax -- …`。三項演算子の中では `{/* */}` は効かない
     - 置き場所は、実装時に `npm run lint` が通ることで確かめる
   - 違反が直ると、不要になった `eslint-disable` が `npm run lint` でエラーになる(消し忘れない)。
   - 例外の一覧は、`grep -rn "表示規約の例外" frontend/features` で出せると CLAUDE.md に書く(一覧を手で保守しない)。見出しを lint は強制しないので、確認項目に `grep -rn "eslint-disable.*no-restricted" frontend/features | grep -v 表示規約の例外` が空であることを入れる。
   - 例外を足してよい基準(CLAUDE.md に書く): 恒久は、理由が取得状態でないこと(ハイドレーション待ち・初期選択の待ち)。一時は、移行チケットの番号があること。
   - 違反を直したら、その行の `eslint-disable` も消す(消さないと lint が落ちる。作業中のブランチは、main を取り込んだあとに落ちることがある)と、CLAUDE.md に書く。
3. **ルール(`*.test.tsx` を除く)**:
   - `features/**/index.tsx` のみ — `no-restricted-imports`: `@mui/material` の `CircularProgress` と、`@mui/material/CircularProgress`。メッセージで `AsyncBoundary` を案内する。`index.tsx` に限るのは、`features/**/*.tsx` に広げると送信ボタンのスピナー 18 本を誤検出するため。
   - `features/**/*.tsx` — `no-restricted-syntax`:
     - `JSXText[value=/取得に失敗/]` — 手書きの失敗表示を検出する(広げても違反は 2 件)
     - `Literal[value='データの取得に失敗しました']` — `ErrorState` の既定文言そのものの直書きを検出する
   - `features/**/index.tsx` — `no-restricted-syntax` に、**条件の位置**で名前が `/[Ll]oading$/` の識別子を使うことを禁止するセレクタを足す(`loading`・`isLoading`・`teacherLoading` のようなリネームに当たる)。メッセージで `AsyncBoundary` を案内する。セレクタ(検証済み):
     - `IfStatement > Identifier.test[name=/[Ll]oading$/]`
     - `IfStatement > UnaryExpression.test > Identifier[name=/[Ll]oading$/]`
     - `IfStatement > LogicalExpression.test Identifier[name=/[Ll]oading$/]`
     - `ConditionalExpression > Identifier.test[name=/[Ll]oading$/]`
     - `ConditionalExpression > UnaryExpression.test > Identifier[name=/[Ll]oading$/]`
     - `ConditionalExpression > LogicalExpression.test Identifier[name=/[Ll]oading$/]`
     - `LogicalExpression > Identifier.left[name=/[Ll]oading$/]`
     - 現在の違反は `CreateStudent` の 1 件だけ。`<P loading={loading} />` のような props の受け渡しは、条件の位置にないので誤検出しない。
     - **効果は限られる**: `useApiQuery` は `loading` を持たないので、この規則が効くのは、手書きの取得フックが `loading` を返す新しい画面だけ。名前が `loading` を含まない変数(`pending` など)や、`!data` 単独の分岐は検出できない。**`index.tsx` の設定ブロックは、`JSXText`・`Literal` も含めた 1 つのリストにする**(同じルールを後のブロックが置き換えるため)。
   - **`errorMessage` や `message` の属性に渡す具体的な文言(「タスクの取得に失敗しました」など)は許可する。** 採用済みのパターンのため(CLAUDE.md に許可側の書き方として書く)。
4. **機械で守らない禁止事項は、CLAUDE.md とレビューで守る**と、はっきり書く: `!data` 単独の分岐(`if (!user) redirect(...)` のような正当な使い方と区別できない)、401 以外の `.catch` の握りつぶし、手書きの取得フック(14 本が `apiClient.get` を直接呼んでいる。静的なルールでは誤検出が多く、検出できない。`.ts` のフックに失敗文言を `setError("…取得に失敗しました")` と書く 4 本も、この見え方)、ローディング分岐を Presenter へ移すこと、失敗文言を `{"…取得に失敗…"}`(式の中のリテラル)・テンプレートリテラル・変数で書くこと(JSX テキストのルールは見逃す)。`Alert` の `severity="error"` の禁止は、`Login`・`SignUp` を誤検出するので入れない。
5. **今ある例外の扱い**:
   - 恒久(3 本): `student/Calendar`・`teacher/InterviewCalendar`・`teacher/CreateInterview`。理由を `eslint-disable` の理由に書く。
   - 一時(2 画面): `teacher/CreateStudent`(`index.tsx` の `CircularProgress` の import と、`if (teacherLoading)`、手書きの `<Alert>` の 3 行)と、`teacher/StudentDetail/Presenter.tsx`(タブ切替後の失敗表示。再試行ボタンなし)。`eslint-disable` の理由に、フォローアップのチケット **TSK-231**(手書きの失敗表示 2 件を `ErrorState` に直す。Backlog、Priority Medium。起票済み)の番号を書く。このチケットでは直さない(案 I)。CLAUDE.md の `StudentDetail` の記述にも「再試行は未対応。TSK-231」と足す。
   - 「禁止ルール導入済み」でも、違反が 2 画面残っていることを、PR 本文と CLAUDE.md に書く。
   - フォローアップは 1 本の起票のまま、子項目を 2 つに分ける(`CreateStudent` の移行 / `StudentDetail` の `ErrorState` 化)。片方だけ先にマージしてよい。`eslint-disable` の理由の番号は共通。
6. **`frontend/CLAUDE.md` を更新する**: 禁止事項(機械で守るものと、レビューで守るものを分けて書く)、共通部品の案内(`ErrorState`・`CardSkeleton`・`TableSkeleton`・`AsyncBoundary`・`useApiQuery`)、許可側の書き方(`message`・`errorMessage` 属性への具体文言)、実装・レビュー時の確認項目(「新しい取得は `useApiQuery` を使い、`apiClient.get` を直接呼ばない。レビュー時は `git grep` で確かめる」を含む)、例外の見つけ方と、例外を足してよい基準。規約5の割り当て表から「案」を外し、「既存画面の移行は別チケットで行う」を消し、良い例を `AsyncBoundary` を使う形に直す。
7. **「一時」の例外が放置されて恒久化しないよう、PR テンプレート(`.github/pull_request_template.md`)のチェックリストに 1 行足す**(オーナーが 2026-11-04 に承認): 「`grep -rn "表示規約の例外(一時)" frontend/features` の件数が増えていない(増やす場合は、理由に移行チケットの番号を書いた)」。
8. **利用者に見える変化は無い。** 入れる効果は、手書きのローディング・エラー表示と、そこから生まれる「無限スピナー」の再発を、新しい画面で防ぐこと(開発チームのメリット)。利用者へのメリットは、そのぶん不具合が減るという間接的なものにとどまる(正直に)。

## 比較した案

| 案                                                                                         | 採否     | 理由                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A: 元の草案どおり(CLAUDE.md + 走査テスト + ESLint。許可リストを 2 か所)                    | 不採用   | 許可リストがずれる。走査テストが足すものが、ESLint の機能(`reportUnusedDisableDirectives`)と CI の `npm run lint` で足りる                                                                 |
| B: ESLint 1 本 + 違反の行の `eslint-disable`(理由つき) + CLAUDE.md                         | **採用** | 許可が違反の行にあり、消し忘れは lint が教える。仕組みが 1 つで済む                                                                                                                        |
| C: 走査テストだけ                                                                          | 不採用   | エディタで書いた時点で気づけない                                                                                                                                                           |
| D: CLAUDE.md だけ                                                                          | 不採用   | 移行に 20 本近いチケットがかかったことが示すとおり、書いてあるだけでは再発する                                                                                                             |
| E: 「取得に失敗」を含む文字列リテラルをすべて禁止する                                      | 不採用   | 採用済みのパターン(`errorMessage` に具体文言)の 5 本を誤検出する                                                                                                                           |
| F: `Alert` の `severity="error"` を禁止する                                                | 不採用   | `Login`・`SignUp` のフォームエラー表示を誤検出する                                                                                                                                         |
| H: `CircularProgress` の import の禁止を `features/**/*.tsx` に広げる                      | 不採用   | 22 ファイルが引っかかり、増える 18 本は送信ボタンの「処理中」スピナー(正当)。広げるなら「ボタンの中のスピナーは許可」を書き分ける必要があり、規模に合わない                                |
| G: `CreateStudent` もこのチケットで移行する                                                | 不採用   | 移行は取得フックの書き直しを伴い、規模と性質が違う。別チケットにして、このチケットを小さく保つ                                                                                             |
| I: `StudentDetail` のタブ切替後の失敗表示を、このチケットで `ErrorState`(再試行つき)に直す | 不採用   | `Presenter` に `onRetry` を渡すだけで直せそうだが、教師画面の見た目の変更を伴い、lint のチケットの範囲を超える。「一時」の例外にして、`CreateStudent` と同じフォローアップのチケットで直す |
| J: `loading` を使う分岐を、機械化せず CLAUDE.md の文章に留める                             | 不採用   | 試したところ `index.tsx` に 0 件で、誤検出が無い。機械化できるものを文章に留める理由が無い                                                                                                 |

## やること

- [x] **起票済み(このチケットの PR を出す前に必須だった)**: フォローアップの TSK-231(Backlog、Priority Medium)。`teacher/CreateStudent` を `useApiQuery` + `AsyncBoundary` に移行し、`teacher/StudentDetail` のタブ切替後の失敗表示を `ErrorState`(再試行つき)に直す。このチケットの `eslint-disable` の理由に、TSK-231 を書く
- [ ] ESLint の設定のテストを、実装の最初に 1 本書いて実行時間を測る(`overrideConfigFile` で本物の設定を読ませる)。2 秒以内なら必須。超えたら、同じ入力と `eslint` の出力を PR 本文に貼る(オーナーが PR レビューで確認する)。入力は次のとおり
  - 出る: `CircularProgress` の名前付き import、個別 import、`<Alert>` の中の「取得に失敗しました」の JSX テキスト、`"データの取得に失敗しました"` のリテラル
  - 出る(`index.tsx` のみ): `if (loading)`、`if (!loading)`、`if (x || loading)`、`loading ? … : …`、`loading && …`、リネームした受け取り(`const { loading: teacherLoading } = …; if (teacherLoading)`)
  - 出ない(`index.tsx` のみ): `<P loading={loading} />` の props の受け渡しが、`if` の本体・三項演算子の本体・`cond && …` の中にあるもの
  - 出ない: `errorMessage="タスクの取得に失敗しました"`、`index.tsx` で `loading` を props として渡すだけ、`*.test.tsx` の中の `CircularProgress`、`features/**/index.tsx` 以外のファイルの `CircularProgress`(ボタンの送信中のスピナーなど。正当)
  - 出ない(例外): 理由つきの `eslint-disable-next-line` が付いた違反。**2 形**を入れる: 単行の開始タグ(`{/* … */}` を開始タグの行の直前に)と、複数行の開始タグ + 三項演算子(`>` の直前の `//`)。`Literal` ルールは現在 0 件なので、効いていることを示すのはこの入力だけ(必須)
  - 出る(消し忘れ): 違反の無い行に付いた `eslint-disable`
- [ ] `eslint.config.mjs` に、ルールと `linterOptions.reportUnusedDisableDirectives: "error"` を追加する(Green)
- [ ] 今ある例外(恒久 3 本、一時 2 画面)に、理由つきの `eslint-disable-next-line` を付ける。**最初に `CreateStudent`(単行タグ)と `StudentDetail`(複数行タグ + 三項演算子)の 2 件で、置き場所を `npm run lint` が通ることで確かめる**
- [ ] `frontend/CLAUDE.md` を更新する(「設計」の 6)
- [ ] `.github/pull_request_template.md` のチェックリストに、一時の例外の件数の確認を足す(「設計」の 7)
- [ ] 完了条件を満たすことを、`npm run lint` / `test` / `typecheck` / `format:check` で確かめる

## 完了条件

- [ ] `features/**/index.tsx` で `CircularProgress` を import すると、`npm run lint` が失敗する(名前付き・個別 import の両方)
- [ ] `features/**/*.tsx`(テスト除く)の JSX テキストに「取得に失敗」を書くか、「データの取得に失敗しました」をリテラルで書くと、`npm run lint` が失敗する。`errorMessage` に具体的な文言を渡すのは、失敗しない
- [ ] 違反の行に、理由つきの `eslint-disable-next-line` を付けると通り、違反が無くなった行に残すと `npm run lint` が失敗する
- [ ] 今ある例外(恒久 3 本、一時 2 画面)に、`表示規約の例外(恒久|一時): …` の見出しと、理由(恒久)またはチケット番号(一時)が書かれ、`grep -rn "表示規約の例外" frontend/features` で、行ごとの一覧(恒久 3 行、`CreateStudent` 3 行、`StudentDetail` 1 行の 7 行。実装で確定)が出る。一時の例外の理由のチケット番号は、フォローアップの 1 種類だけ。`grep -rn "eslint-disable.*no-restricted" frontend/features | grep -v 表示規約の例外` は空
- [ ] 上の「やること」の入力に対して、期待どおりに `error` が出る/出ないことが、テスト(実行時間が 2 秒以内のとき必須)か、入力と `eslint` の出力を貼った PR 本文(超えたとき。オーナーが PR レビューで確認する)で示されている
- [ ] `frontend/CLAUDE.md` に、禁止事項・共通部品の案内・確認項目・例外の見つけ方が載り、「案」と「別チケットで行う」の古い記述と、`CircularProgress` を使う良い例が無い
- [ ] `features/**/index.tsx` で、名前が `/[Ll]oading$/` の識別子を条件の位置で使うと、`npm run lint` が失敗する(現在の違反は `CreateStudent` の 1 件で、例外に入っている)。`<P loading={loading} />` の props の受け渡しは失敗しない
- [ ] 機械で守らない禁止事項(`!data` 単独の分岐、握りつぶし、手書きの取得フック(`.ts` のフックの失敗文言を含む)、Presenter への分岐の移動、式の中のリテラルでの失敗文言)が、CLAUDE.md に「レビューで確認する」と書かれている
- [ ] PR 本文と CLAUDE.md に、「`CreateStudent` と `StudentDetail` は一時の例外として残っている(フォローアップ: TSK-231)」と書かれている
- [ ] `.github/pull_request_template.md` のチェックリストに、一時の例外の件数が増えていないことの確認が入っている
- [ ] 実装後の(この PR のブランチの)状態で、`npm run lint` / `test` / `typecheck` / `format:check` が通る

## 依存

- 移行チケット(TSK-221〜226、Analytics、admin・teacher・student の各移行): マージ済み(2026-11-04 に確認)
- フォローアップの **TSK-231**(`teacher/CreateStudent` の移行と、`teacher/StudentDetail` のタブ切替後の失敗表示の `ErrorState` 化。起票済み)。このチケットの PR を出す前に番号が要った(`eslint-disable` の理由に書くため)。TSK-231 そのものの完了は、このチケットのマージに必須でない
