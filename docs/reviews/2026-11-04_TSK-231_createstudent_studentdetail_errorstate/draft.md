## 概要

手書きのローディング・エラー表示が残っている 2 画面を、共通部品(`AsyncBoundary` / `ErrorState`)に直す。TSK-216(ローディング・エラー表示の直書きを禁止する lint)の設計レビューで見つかり、TSK-216 では「一時の例外」(`eslint-disable` の理由にこのチケットの番号を書く)として残した。このチケットで例外を外し、**一時の例外を 0 件にする**。

- 子項目 1: `teacher/CreateStudent` を `useApiQuery` + `AsyncBoundary` に移行する(**再試行ボタンが付く**)
- 子項目 2: `teacher/StudentDetail` のタブ切替後の失敗表示を `ErrorState` + 再試行にする(**再試行ボタンが付く**)

どちらも、**失敗したときに再試行できない**という利用者に見える不具合(規約 4 違反)の修正を含む。子項目は独立しているが、**PR は 1 本にまとめる**(オーナー確認済み。2 本にすると CLAUDE.md の同じ行を触り、2 本目は 1 本目のマージ後に切る必要があるため)。コミットは子項目ごとに分ける。

**TSK-216(PR #240)のマージ後に着手する。** 外す対象の `eslint-disable` と、CLAUDE.md の「現在の一時の例外」の記述が、#240 にしか無いため。

## 背景(調査結果)

### 子項目 1: `teacher/CreateStudent`

- `features/teacher/CreateStudent/index.tsx` は、`loading: teacherLoading` で分岐する手書きの `CircularProgress`(`height: 100%` で中央寄せ)と、手書きの `<Alert severity="error">教員情報の取得に失敗しました。再読み込みしてください。</Alert>` を持つ。**再試行ボタンが無い**(利用者は画面を再読み込みするしかない)。
- 取得は 2 本あり、**どちらも手書き**(`apiClient.get` を直接呼ぶ)。
  - `hooks/useCurrentTeacher.ts`: `/api/teacher/me` から `grade_scope` と学年を取り、`restrictedGradeId`(学年制限のある教員の学年。無ければ `null`)を作る。`loading` / `error` は自前で管理する。
  - `hooks/useGradeOptions.ts`: `/api/teacher/school-classes` から学年・学級の選択肢を取り、`restrictedGradeId` で絞る。**401 以外の失敗を握りつぶす**(`.catch` で 401 のときだけ `/login` に遷移し、他は何もしない)。そのため、**学級一覧の取得に失敗すると、学年の選択肢が空のままフォームが出る**(生徒を作れないのに、理由が表示されない)。**ticket の草稿には載っていなかった、同じ画面の不具合**。
- 2 本の取得は、いずれも `index.tsx` の最上位で、早期 return より前に呼ばれる。つまり**今は並列に取得している**。
- `index.test.tsx` は**無い**(`Presenter.test.tsx` と、3 本のフックのテストだけ)。フックのテストは `loading` フラグを前提にしている。
- 呼び出し元は `app/(teacher)/teacher/(authenticated)/students/new/page.tsx` だけ。
- ticket の草稿は `hooks/useCurrentTeacher.ts` と書いていたが、実際の場所は `features/teacher/CreateStudent/hooks/useCurrentTeacher.ts`。

### 子項目 2: `teacher/StudentDetail`

- 最初の取得とその失敗は、すでに `AsyncBoundary`(`error={!data && error}`)で画面全体に出し、再試行もできる。
- タブ切替後の失敗だけ、`Presenter.tsx`(115〜122 行)が手書きの `<Typography>データの取得に失敗しました</Typography>` を出す。**再試行ボタンが無い**。ヘッダー(生徒名・ボタン)とタブは残る。
- `index.tsx` は `refetch` を持っているが、`Presenter` に渡していない。`useStudent` の `refetch` は `reloadKey` を進めて**今のタブ・ページのまま再取得する**。
- 同じ「Presenter の中に `ErrorState` を出す」形が、すでに 2 か所にある(`teacher/InterviewDetail/Presenter.tsx`、`teacher/SchoolClassRequestDetail/Presenter.tsx`)。`ErrorState` が持つ余白(`p: 3`)を `<Box sx={{ mx: -3, mt: -3 }}>` で打ち消している。

### 検証済みの前提

| 前提                                                                                                                           | 確かめ方                                                                  | 結果                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CreateStudent の 2 本の取得は、今は並列                                                                                        | `index.tsx` を読む                                                        | 2 本とも最上位で呼ばれ、`useGradeOptions` は `restrictedGradeId` を待たずに取得を始める(絞り込みは取得後)。**移行後も、フックを `AsyncBoundary` の外(上)に置けば並列のまま。内側のコンポーネントに移すと直列になる**                  |
| `useGradeOptions` は 401 以外の失敗を握りつぶす                                                                                | `hooks/useGradeOptions.ts` を読む。テストは 401 の 1 ケースだけ           | そのとおり。失敗の挙動のテストが無い                                                                                                                                                                                                     |
| `/api/teacher/me`・`/api/teacher/school-classes` は、`useApiQuery` でそのまま取れる                                           | 同じ URL を `useApiQuery` で取る画面があるか調べる                        | `/api/teacher/school-classes` は `CreateSchoolClassRequest/index.tsx` と `SchoolClasses/hooks/useSchoolClasses.ts` が `useApiQuery` で取っている。`/api/teacher/me` は BFF が `/api/v1/me` をそのまま返す(ステータスも素通し)            |
| 取得に失敗したとき、フォームを出さない現行の挙動(学年制限を不明なまま扱わない)は、`AsyncBoundary` の分岐(エラー → ローディング → 成功)でも保てる | `AsyncBoundary.tsx` と `useApiQuery.ts` を読む                            | `AsyncBoundary` は `error` を最初に見て、`data` が無い間はスピナーを出し、成功のときだけ `children` を呼ぶ。フォームは成功のときにしか出ない                                                                                            |
| 失敗後に再試行しても、入力途中のフォームは消えない                                                                             | `useCreateStudentForm`(`useForm`)が `index.tsx` の最上位にあることを読む | フォーム(`useForm`)は `AsyncBoundary` の外にある。それ以前に、**エラーになるのは最初の取得だけ**(`refetch` はエラー表示からしか呼べず、成功後に再取得する経路が無い)なので、入力途中のフォームは存在しない                          |
| StudentDetail の `refetch` は、タブ切替後の失敗でも今のタブ・ページを再取得する                                               | `useStudent.ts` と `useStudent.test.ts` を読む                            | `reloadKey` を進めると effect が `tab`・`page` のまま再実行される。「`refetch` を呼ぶと同じ条件で再取得する」テストが既にある                                                                                                            |
| StudentDetail のエラー表示を `ErrorState` にしても、ヘッダーとタブは残る                                                       | `Presenter.tsx` を読む                                                    | エラー分岐が置き換えるのは、タブの下の中身だけ。ヘッダーとタブは分岐の外。既存のテスト「取得に失敗したときはヘッダーを残したままエラーを表示する」が同じ構造を確かめている                                                              |
| BFF(`/api/teacher/students/[studentId]`、`/api/teacher/me`)は、バックエンドのステータスを素通しする                         | 各 `route.ts` を読む                                                      | `NextResponse.json(data, { status })` で素通し。500 を返せば 500 のままブラウザに届く(`page.route` での再現と、実際の失敗が同じ形になる)                                                                                               |
| 最初の取得の失敗は、今後も画面全体のエラーのまま変わらない                                                                     | `index.tsx` を読む                                                        | `error={!data && error}` は変えない                                                                                                                                                                                                      |
| `ErrorState` を `Presenter` の中に出す形の先例がある                                                                           | `git grep "<ErrorState" features`                                         | `InterviewDetail`・`SchoolClassRequestDetail` の `Presenter` が、`mx: -3, mt: -3` で余白を打ち消して出している                                                                                                                          |

### 未検証の前提

| 前提                                                                                                                                                              | 確かめる方法                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| StudentDetail: 先例の `mx: -3, mt: -3` で、タブの下に自然に収まるか。**たぶん合う(構造からの推測)**: `Tabs` が `mb: 3` を持ち、`ErrorState` の `p: 3` の上辺を `mt: -3` で打ち消すので、タブの下は 24px、左右は内容の幅にそろう | 実装後、PR の前に実画面で確かめる(教師アカウント、PC とスマホ幅)。タブ切替後の失敗は、Playwright の `page.route` で `tab=goals` のリクエストだけ 500 にして再現する(バックエンドは止めない)。**1 回だけ 500 にして、再試行で成功する経路**も確かめる。合わなければ `mt` だけ調整する。開発 DB への一時データが要る場合は、オーナーの了承を得てから作り、終わったら片付ける |
| CreateStudent: ローディングが `height: 100%` の中央寄せから、`AsyncBoundary` のスピナー(`minHeight: 240`)に変わって、見た目が大きく変わらないか                | 同じ実画面の確認で、移行前後を比べる                                                                                                                                                                                                  |

## 設計

### 子項目 1: `CreateStudent`

- `useCurrentTeacher` を `useApiQuery<MeResponse>("/api/teacher/me")` の薄いラッパーにする。`restrictedGradeId` と `gradeScope` の導出は残す(`useMemo`)。`loading` を廃止し、`error`・`refetch`・取得済みかどうかが分かる値(`data`)を返す。
- `useGradeOptions` を、`useApiQuery<GradeOption[]>("/api/teacher/school-classes")` の薄いラッパーにする。`restrictedGradeId` で絞る処理は残す。戻り値の選択肢は **`GradeOption[] | null`**(取得前は `null`。取得できた空配列 `[]` は有効な値で、学級が 0 件の学校では正しい)、ほかに `error`・`refetch`。**学級一覧の失敗を握りつぶさない**。
- `index.tsx`: 2 つのフック、フォーム(`useCreateStudentForm`)、`useCreateStudent` を、**今と同じく `AsyncBoundary` の外(上)で呼ぶ**(並列取得を保つ)。`AsyncBoundary` には次を渡し、`children` で `Presenter` を出す。
  - `data`: 「`/me` と学級一覧の**両方**が取得済みのときだけ絞り込み後の選択肢、それ以外は `null`」。`[]` は `AsyncBoundary` が有効な data として扱う(`null` / `undefined` だけがローディング)ので、`length` や真偽では判定しない
  - `error`: どちらかの失敗
  - `onRetry`: **error になっている側の `refetch` だけ**を呼ぶ(成功している側を無駄に再取得しない)
  - `errorMessage`: 「教員情報・学級の取得に失敗しました」の類の文言(再試行ボタンが付くので「再読み込みしてください」は外す)
- 絞り込み(`restrictedGradeId` で `filter`)と、「取得前は `null`」の判定は、**`useGradeOptions` の中の `useMemo` に残す**。`index.tsx` では新しい配列を作らない(`Presenter` の `useEffect` が参照の変化で走り直さないようにする)。
- 401 のとき、どちらの `useApiQuery` も `router.push("/login")` する(二重 push)。`error` は立たない。**現行も 2 本が別々に push していて同じ**。ただし現行は `finally` で `loading=false` になり、空のフォームが一瞬出る。移行後は `/login` に遷移するまでスピナーのまま(改善。オーナー確認済み)。
- `Teachers/hooks/useGradeOptions.ts` は**別のフック**(名前が同じ)で、このチケットの対象外。grep で混同しない。
- **利用者に見える変化**:
  - 失敗したとき、再試行ボタンが付く(今は再読み込みするしかない)。
  - 学級一覧の取得に失敗したとき、空の選択肢のフォームではなく、エラー表示 + 再試行になる(今は理由が出ない)。
  - ローディングが `height: 100%` の中央寄せから、共通のスピナーに変わる。
  - **今は `/me` が返れば学級一覧が未着でもフォームが先に出て、選択肢があとから埋まる。移行後は 2 本そろうまでスピナー**になる(選択肢が空のフォームが一瞬出ることが無くなる)。
- **今の挙動のうち、直さずに受け継ぐもの**: `own_grade` で `grade` が `null` の教員は `restrictedGradeId = null` になり、全学年が選べる。仕様か不具合かは**未解決**(下の「未解決の点」)。サーバー側の認可(生徒作成時の学年検証)は**確かめていない**。このチケットでは直さず、特性化テストで現行の挙動を固定する。

### 子項目 2: `StudentDetail`

- `Presenter` に `onRetry: () => void` を足し、`error` の分岐を `<ErrorState onRetry={onRetry} />`(先例どおり、余白を `Box` で調整)に置き換える。文言は `ErrorState` の既定(「データの取得に失敗しました」)のままにして、現行と同じにする。
- `index.tsx` から `onRetry={refetch}` を渡す。
- **利用者に見える変化**: 中央のグレーの文字が、エラーの `Alert` と「再試行」ボタンに変わる。再試行を押すと、今のタブ・ページを再取得する(その間はスピナー)。ヘッダーとタブは残る。

### 例外とドキュメント

- `eslint-disable`(`表示規約の例外(一時)`)を、`CreateStudent/index.tsx` の 3 行と `StudentDetail/Presenter.tsx` の 1 行から外す(消さないと `reportUnusedDisableDirectives` で lint が落ちる)。
- `frontend/CLAUDE.md`:
  - 23 行目付近の StudentDetail の例外の説明は、「ただし…再試行ボタンが無く…一時の例外。TSK-231 で…」の部分**だけ**消す。「ヘッダーを残したまま中身だけエラーにする」という例外の理由の説明は、今も正しいので残す。
  - 規約 5 の直後の「手書きの表示が残るのは下の『例外の扱い』の画面だけ」は、両方移行したら「手書きの表示が残る画面は無い(例外は恒久のものだけ)」の形に直す。
  - 115〜116 行目付近の置き場所の例(`{/* */}` と `//` の 2 形)は、例のファイル(`CreateStudent/index.tsx`、`StudentDetail/Presenter.tsx`)から `eslint-disable` が消えるので、**ファイルへのリンクをやめ、`lint/displayRules.test.ts` の該当テストを実例として指す**(オーナー確認済み)。
  - 130 行目付近の「現在の一時の例外」は、両方移行したら「なし」に直す。例外の節の書き方(見出し・基準)は残す。
  - 更新箇所は、23 行目・規約 5 の直後・115〜116 行目・130 行目の 4 か所。
- 置き場所の例が指す `eslint-disable` の見本の文字列(`TSK-231 で移行予定`)は、実際の移行チケットではなく見本であることを、CLAUDE.md の更新で一言添える。
- **PR は 1 本**(オーナー確認済み)なので、上の 4 か所を同じ PR でまとめて直す。

## 比較した案

| 案                                                                                                       | 採否     | 理由                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A: `useGradeOptions`(学級一覧)は対象外にして、`/me` だけ移行する                                         | 不採用(オーナー確認済み) | `/me` だけ移すと、移行済みの画面に、401 以外を握りつぶす手書きの取得が残る(レビューで確認する項目)。学級一覧が失敗しても理由が出ないままで、再試行が付かない                                  |
| B: 2 本の取得を、1 つの内側のコンポーネントにまとめて直列にする                                          | 不採用   | 今は並列。直列にすると、表示までの待ち時間が増える                                                                                                                                           |
| C: 2 本の取得を 1 つのフックにまとめる(`useGradeOptions` が `/me` も取る)                                | 不採用   | テストの移し替えが大きい。`useCurrentTeacher` の導出(`gradeScope` など)の責務が混ざる。2 本の薄いラッパーのほうが差分が小さい                                                                 |
| D: StudentDetail の失敗表示に、`ErrorState` を使わず手書きの再試行ボタンを足す                           | 不採用   | 手書きの失敗表示を残すことになる。`ErrorState` を使えば、見た目と再試行が共通になる                                                                                                          |
| E: StudentDetail のタブ切替後の失敗も `AsyncBoundary` で画面全体に出す                                   | 不採用   | ヘッダーとタブごと置き換わり、別のタブへ移る手段が消える。規約の例外の理由(ヘッダーを残す)が失われる                                                                                         |
| F: 子項目 1 と 2 を別チケットに分ける                                                                    | 不採用   | TSK-216 で 1 本にまとめて起票した(性質の違いは子項目とコミットの分け方で吸収)。分け直すと「一時の例外」を追う場所が増える                                                       |

## やること

テスト観点を含む。順序が大事なものは、番号の順に行う。

### 子項目 1: `CreateStudent`

1. **特性化テスト(`index.test.tsx` を新規)を、移行前のコードで書いて緑にする**。フックのテストは `loading` を前提にしていて移行で書き換わるので、画面(`index`)のテストを土台にする。2 本の取得は並列なので、`apiClient.get` は `mockImplementation((url) => …)` で **URL ごとに**返す(`mockResolvedValueOnce` の呼び出し順に頼らない)。
   - (エラーの判定は、現行の文言ではなく `role="alert"` とフォームの不在で行う。移行で文言が変わっても落ちないようにする)
   - 取得中はスピナーを出し、フォームもエラーも出さない
   - 2 つの取得が成功するとフォームを出す
   - 学年制限のある教員は、選択肢が自分の学年だけになる(`own_grade`)。`all_grades` / 権限なしは全学年
   - `own_grade` で `grade` が `null` の教員は、全学年が選べる(**現行の挙動を固定するだけ**。仕様か不具合かは未解決)
   - 学級一覧が `[]` のとき、フォームを出す(永久スピナーにならない)
   - `/me` が 401 のとき、`/login` に **1 回以上** push し、エラーを出さない(push の回数は固定しない)
   - `/me` が 500 のとき、エラーを出し、**フォームを出さない**(学年制限を不明なまま扱わない)
   - **学級一覧が失敗したときの現行の挙動(空の選択肢のフォームが出る)は、不具合なので特性化しない**(次の Red で扱う)
2. **Red のテストを足す**(現行で失敗することを確かめてコミット)。
   - `/me` は成功、学級一覧は未解決のあいだは、フォームを出さずスピナー。学級一覧が解決するとフォームが出る(現行は `/me` だけでフォームが先に出るので、本物の Red)
   - 学級一覧だけ 401 のとき、エラーを出さず `/login` に push し、フォームは出ない(現行は空のフォームが出る)
   - `/me` の失敗 → 「再試行」を押す → `/me` だけ再取得してフォームが出る
   - 学級一覧(`/api/teacher/school-classes`)の失敗 → エラーを出し、フォームを出さない → 再試行で、**失敗した側だけ**再取得して復帰する
3. `useCurrentTeacher` / `useGradeOptions` を `useApiQuery` のラッパーにし、`index.tsx` を `AsyncBoundary` に置き換え、**フックのテストを新しい戻り値(`loading` が無い、`error`・`refetch`・`null` の扱い)に書き換えるのも、同じコミットで行う**(別のコミットにすると、`loading` が無くなった時点でフックのテストが落ちたコミットができる)。導出(`restrictedGradeId`、絞り込み)のケースは残す。1・2 が緑になること。**`eslint-disable`(`index.tsx` の 3 行)と、使わなくなった `Alert` / `Box` / `CircularProgress` の import を外すのも、同じコミットで行う**(置き換えた時点で `eslint-disable` は不要になり、`reportUnusedDisableDirectives` で lint が落ちるため)。

### 子項目 2: `StudentDetail`

1. **Red のテストを先に書く**。
   - `Presenter.test.tsx`: `error` のとき、「再試行」ボタンが出て、押すと `onRetry` が呼ばれる。ヘッダーとタブは残る。
   - `index.test.tsx`: タブ切替後の失敗 → 「再試行」を押す → **同じタブ**を再取得して画面を出す(`Presenter` のモックに `onRetry` を渡す)。**主眼は、`index.tsx` が `refetch` を `Presenter` に渡す配線**(押すと `apiClient.get` が同じ `tab` で再度呼ばれる)。再取得そのもののテストは `useStudent.test.ts` に既にあるので、足さない。
2. `Presenter` に `onRetry` を足し、`ErrorState` に置き換える。`index.tsx` から `refetch` を渡す。**`eslint-disable`(`Presenter.tsx` の 1 行)と、使わなくなった import も、同じコミットで外す**(別にすると途中で lint が落ちる)。

### 共通

- `frontend/CLAUDE.md` の更新(上の「例外とドキュメント」)。
- `npm run test` / `lint` / `format:check` / `typecheck`。
- 実画面の確認(教師アカウント、PC とスマホ幅。上の未検証の 2 件)と、スクリーンショット。
- `docs/reviews/README.md` の答え合わせを更新する(`/ticket` の手順 8.5)。

## 完了条件

- [ ] `CreateStudent` の取得失敗(`/me`)で、再試行ボタンつきのエラー表示が出て、再試行でフォームが出る(テストで確認)
- [ ] `CreateStudent` の学級一覧の取得失敗で、エラー表示と再試行が出て、空の選択肢のフォームは出ない(テストで確認)
- [ ] 取得失敗のとき、`CreateStudent` のフォームは出ない(学年制限を不明なまま扱わない。テストで確認)
- [ ] `StudentDetail` のタブ切替後の取得失敗で、再試行ボタンつきのエラー表示が出て、ヘッダーとタブは残り、再試行で同じタブを再取得する(テストと実画面で確認)
- [ ] `grep -rn "表示規約の例外(一時)" frontend/features` が、現在の 4 行(`CreateStudent/index.tsx` に 3 行、`StudentDetail/Presenter.tsx` に 1 行)から **0 行**になる
- [ ] `grep -rn "eslint-disable.*no-restricted" frontend/features | grep -v 表示規約の例外` が空のまま
- [ ] `frontend/CLAUDE.md` の「現在の一時の例外」と StudentDetail の注記が、現状と合っている
- [ ] PR に実画面のスクリーンショットを貼る(CreateStudent のローディング・失敗、StudentDetail のタブ切替後の失敗。PC とスマホ幅)
- [ ] `npm run test` / `lint` / `format:check` / `typecheck` が通る

## 未解決の点

- `own_grade` で `grade` が `null` の教員に全学年を選ばせる現行の挙動が、仕様か既知の不具合か(オーナーに未確認)。このチケットでは直さず、特性化テストで固定する。不具合なら別チケットにする。サーバー側の認可は確かめていない。
- 実画面で確かめる 2 件(StudentDetail の余白、CreateStudent のローディングの見た目)は、実装後に確認する。

## 依存

- TSK-216(PR #240)がマージされていること(外す `eslint-disable` と、`CLAUDE.md` の記述が #240 にある)
- 優先度は Medium。「一時の例外」が恒久化しないようにするため(TSK-216 のオーナー確認、2026-11-04)
