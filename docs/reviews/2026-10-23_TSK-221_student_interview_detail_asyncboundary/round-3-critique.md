# 批判：student/InterviewDetail の AsyncBoundary 移行（第3周）

## 前回の指摘の扱いの確認（対応表と draft.md の突き合わせ）

| 第2周の指摘 | 対応表の主張 | draft.md の本文 | 判定 |
|---|---|---|---|
| 1 再試行中は常にスピナー | `refetch` で表示を初期状態に戻す設計に変え、案Fを追加した | 設計48〜51行、利用者に見える変化59行、比較表69行、Red 2・3（79〜80行）、回帰防止89行、完了条件102行が、すべて同じ方針でそろっている。古い「最後の内容を出す」記述の残りは見当たらない | 直った |
| 2 guard の置き場所 | `refetch` にだけ置く。`useRef` を使い、`finally` で解除する | 52行に明記。Red 4（81行）に「`act` の中で1回目の完了前に2回呼ぶ」とある | 直った（ただし解除の書き方が曖昧。下の指摘1） |
| 3 検証済みへの移動と、別経路の別挙動 | 移した。両方をテストで固定する | 34行（検証済み）と89行（回帰防止）にある。Red 2・3 が再試行側を固定している | 直った |
| 4 Red 5 を外す | 外した | Red は4本で、`loading` の記述は実装欄（95行）だけ | 直った |
| 5 `index.test.tsx` の新設 | 書いた | 76行にある。`beforeEach` の `mockReset` も書かれている | 直った |

「直した」と書かれた箇所の直し忘れは、5件とも見当たりません。スピナー方針の一貫性も、5箇所すべてで確認できました。

## 総評
第2周の指摘は漏れなく反映されています。改訂で入った新しい問題は、致命的なものはありません。ただし、**回帰防止に分類された1項目は、現行コードでは失敗するので Red です**（指摘2）。これは草案に書かれていない利用者のメリットでもあります。

## 判定
**直せば進めてよい**。直すのは文言レベルの2点（指摘1・2）と軽微な2点です。どれも草案を直せば済み、オーナー判断は要りません。第3周が最終周なので、これらは本体が直して確定してください。

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒） | 取得失敗時に再読込せず再試行できる。**草案に無いメリットが1つある（指摘2）：401 でログインへ遷移する間、エラー表示が一瞬出ていたのが、スピナーになる** | ローディングの高さが `100vh` から `minHeight: 240` に変わる（記載あり）。取り直しの失敗後の再試行で、一度スピナーを挟む（記載あり。誤解を避けるための意図的な選択で、妥当） |
| 開発チーム | `index.tsx` の直書き除去、TSK-216 の許可リストが 1 件減る、`loading` の削除 | `refetch` ラッパーと `ref` guard が増える。`useApiQuery` を使わない例外が残る（記載あり） |

- 両方にメリットがあるか：利用者に損がない内部整理に、小さな実益（再試行）が付く形。成立しています。
- やらないことのデメリット：
  - 利用者が失うもの：取得失敗時の手動再読込（まれ。推測）。
  - 開発チームが失うもの：許可リストの例外が 1 件残る。致命傷ではなく、案Cの記述は妥当です。
- 草案に書かれていなかったメリット：401 時のエラー一瞬表示の解消（草案に無い。指摘2）。

## 確かめた事実
- `useInterviewDetail.ts` の `fetchDetail`：
  - `finally` は `setLoading(false)` だけです（74〜76行）。`loading` を消すと、`finally` ごと不要になります（空の `finally` は残さず消す）。**他に副作用はないので、`loading` の削除そのものは安全です。**
  - 401 は `catch` 内で `router.push` して `return` します。`finally` は `return` のあとでも実行されます。
  - 失敗時に `interview` と `messages` は消えません。`setError(false)` は成功時にだけ呼ばれます。
- `refetch` ラッパーが `setInterview(null)`・`setMessages([])`・`setError(false)` を行ってから `fetchDetail` を呼ぶ設計は、`fetchDetail` の動作と矛盾しません。
  - 成功すれば `setInterview`・`setMessages` で復帰します。
  - 失敗すれば `setError(true)` で、`interview` が null のままエラー表示に戻ります。`AsyncBoundary` は error を先に判定するので、これで正しいです。
  - 401 なら、`interview` null・error なしのままスピナーで止まり、リダイレクトされます。
- 現行の `index.tsx`：`loading` なら 100vh のスピナー、`!interview || error` なら `ErrorState`。**401 のとき、`finally` で `loading=false`、`interview=null` になるため、リダイレクト前に `ErrorState`（`alert`）が出ます。**
- `AsyncBoundary` は `data` と `error` の組で、期待どおりに分岐します。

## 残すべき強み
- 再試行中は常にスピナーという方針が、5箇所で一貫しています。案Fを退けた理由（再送・再キャンセルの誘発）も具体的です。
- guard を `refetch` にだけ置き、`fetchDetail` に入れない判断は正しいです。送信後の取り直しが捨てられません。
- Red と回帰防止の区別、検証済み・未検証の表、案Aの見直し条件がそろっています。
- オーナー判断待ちと草案の修正を分けて書いています。

## 指摘（重要な順）

### 指摘1【軽微〜重要】（観点：テスト計画／設計の整合）
- 何が問題か：52行に「`fetchDetail` の完了後（`finally`）に解除する」とあります。**どの `finally` なのかが曖昧**です。
  - `fetchDetail` 自体の `finally` で ref を下ろすと、`fetchDetail` に手を入れることになり、「`fetchDetail` 自体には guard を入れない」という同じ段落の方針と食い違います。
  - さらに、送信後の取り直しが先に終わると、`refetch` の取得中なのに ref が下りて、重複を防げなくなります。
  - 401 の早期 `return` でも `finally` は走るので、ref が解除されないことはありません。ただし、これは **`refetch` 側の `try { await fetchDetail() } finally { ref.current = false }` に置いた場合に限って確実**です。
- 根拠：`useInterviewDetail.ts` 59〜77行。`fetchDetail` は例外を内部で握るので、`refetch` 側の `finally` は必ず到達します。
- 直し方の提案：52行を「`refetch` 内で `try { await fetchDetail() } finally { ref を解除 }` とする。解除は `refetch` の中だけで行い、`fetchDetail` には ref を持ち込まない」と書き直します。あわせて、`ref` を下ろす前の `setInterview(null)` 等は、guard を通った1回目だけが行うことを明記します（2回目以降は何もしない）。

### 指摘2【重要】（観点：テスト計画／草案に無いメリット）
- 何が問題か：回帰防止（88行）の「401 で `/login` に遷移し、エラーは出ない」は、**現行コードでは失敗します**（上の「確かめた事実」）。つまり Red です。過去に、既に満たしているテストを Red と呼ぶ誤りがありましたが、今回は逆に、失敗するテストを「現行でも通る」と書いています。
  - このまま実装すると、「現行でも通る」はずのテストが実装前に落ちて、実装者が混乱します。
  - 一方で、これは生徒に見える改善です（ログインへ遷移する間、エラーが一瞬出なくなる）。「利用者に見える変化」（56〜59行）にも載っていません。
- 根拠：`index.tsx` の `!interview || error` と、`useInterviewDetail.ts` 69〜75行（401 でも `finally` が `loading=false` にする）。推測ではなくコードで確認済みです。実画面での確認はしていません。
- 直し方の提案：88行を Red に移し、「現行は 401 でも `ErrorState` が一瞬出る。変更後は出ない」と書きます。「利用者に見える変化」にも1行足します。実画面で確かめる場合は、確認項目に 401 を加えます（必須ではない）。

### 指摘3【軽微】（観点：テスト計画）
- 何が問題か：Red 2（再試行直後にスピナー）と Red 3（取り直し失敗後の再試行）が、`index.test.tsx` では同じ仕組みの別ケースです。偽陽性を避けるには、Red 2・3 とも「再試行の取得が未完了の間に `progressbar` を確認する」ために、`apiClient.get` の戻りを手動で解決できる promise にする必要があります。草案には書かれていません。
- 直し方の提案：「再試行の `get` は解決を遅らせる promise にして、`progressbar` の確認後に解決する」と1行足します。

### 指摘4【軽微】（観点：テスト計画）
- 何が問題か：Red 3 は「送信の取り直しだけを失敗させる」準備が要ります（POST は成功、続く GET は失敗）。`mockResolvedValueOnce` / `mockRejectedValueOnce` の並びが複雑で、消化漏れや順序ずれが起きやすい箇所です（TSK-212 の教訓）。
- 直し方の提案：呼び出しの順序（初回の2本 → POST → 取り直しの GET 群）を、テストに書く前に表で整理するか、URL に応じて返す `mockImplementation` を使うと書いておくと安全です。

## オーナーの判断で進められるもの／草案を直さないと進められないもの

- **草案を直さないと進められない**：なし。指摘1・2も、実装者が迷って困るのは Red の分類と ref の置き場所だけなので、文言を直せば足ります（第3周なので、本体が直して確定してください）。
- **直すと良い**：指摘3・4。
- **オーナーにしか決められない（草案を直さなくてよい）**：
  1. このチケットを進めるか。価値は再試行と、401 時のエラー一瞬表示の解消です（指摘2で1つ増えます）。やらなくても致命傷はありません。
  2. 実画面確認をやるか。開発サーバーと生徒アカウントが要ります。草案は「行わなければ未検証と明記」としているので、行わなくても進められます。
  3. TSK-215 の文言を直すか。

## 本人に確認すべき問い
1. このチケットを進めますか。
2. 実画面確認を行いますか。行う場合は、再試行の確認に加えて、401 のときのエラー表示の有無も見てよいですか。
3. TSK-215 の文言（「422 後に古い状態が残る問題を直せる」）を、「取得失敗時の再試行」に直してよいですか。

参照したファイル：
- /Users/ryonakadoi/Documents/app/edu-platform/docs/reviews/2026-10-23_student_interview_detail_asyncboundary/draft.md
- /Users/ryonakadoi/Documents/app/edu-platform/docs/reviews/2026-10-23_student_interview_detail_asyncboundary/round-2-critique.md
- /Users/ryonakadoi/Documents/app/edu-platform/docs/reviews/2026-10-23_student_interview_detail_asyncboundary/round-2-response.md
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/InterviewDetail/hooks/useInterviewDetail.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/InterviewDetail/index.tsx
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/components/ui/AsyncBoundary.tsx

注記：README.md の「答え合わせ」表と round-1 の2ファイルは、今回は開いていません。第2周の批判・対応表と draft.md の突き合わせ、およびコードの確認を優先しました。
