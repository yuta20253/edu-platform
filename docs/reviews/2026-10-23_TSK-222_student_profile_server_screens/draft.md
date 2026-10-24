## 概要

`features/student/UserProfile` と `EditUserProfile`(どちらも async のサーバーコンポーネント)で、`getMeFromBackend` が `null` を返したときの表示を、静的なスピナーから `redirect("/login")` に直す。あわせて、`EditUserProfile` では、`!user` の判定を `getPrefectures()` の呼び出しより前に移す。`index.tsx` から `CircularProgress` を取り除く。

TSK-215 で範囲外にした画面の1つ。サーバーコンポーネントなので、クライアント用の `AsyncBoundary` / `useApiQuery` は使わない。

## 背景(調査結果)

- 2つの `index.tsx` は、サーバー側で `getMeFromBackend` を呼び、`null` なら `CircularProgress` を返す。**サーバーで描画された静的なスピナーなので、そこから先へ進まない。**
- これらのページが属する `app/(main)/(authenticated)/layout.tsx` は、同じ `getMeFromBackend` を呼び、`null` なら `/login` にリダイレクトする。ページの `!user` に入るのは、次のような場合である。
  - **クライアント遷移(`Link` / `router.push`)でこのページに来たとき。** Next.js の App Router は、共有レイアウトを遷移のたびには再描画しない(推測。Next.js の仕様に基づく。下の未検証を参照)。そのため、セッションが切れたあとで別の画面からプロフィールへ遷移した場合、**レイアウトのガードは動かず、ページの `!user` が唯一のガード**になりうる。
  - レイアウトとページのあいだ(同じ `/me` を2回取っている)で、一時的な失敗が起きたとき。
- `getMeFromBackend` は、401 でも 5xx でも `null` を返す(区別しない)。このため、`redirect("/login")` にすると、**バックエンドの一時障害のときも、ログイン画面に飛ぶ**。親のレイアウトと同じ挙動で、このチケットでは変えない。
- `EditUserProfile` は、`getMeFromBackend` のあと、`!user` の判定より前に `await getPrefectures()` を呼ぶ。`getPrefectures` は `backendFetch` 経由で、**401 のときは `BackendUnauthorizedError`、それ以外の失敗は `BackendFetchError` の例外を投げる**。`app/` に `error.tsx` が無いので、Next.js の既定のエラー画面になる。つまり、セッション切れ(401)のとき、`EditUserProfile` は `!user` の分岐に届く前に例外になる。
- `if (!user)` の分岐を持つ `index.tsx` は、この2つだけ(`grep` で確認)。

### 検証済みの前提

| 前提 | 確かめ方 | 結果 |
| --- | --- | --- |
| 親のレイアウトが `null` を `/login` にリダイレクトする | `app/(main)/(authenticated)/layout.tsx` を読む | `if (!user) redirect("/login")` |
| `getMeFromBackend` は 401 も 5xx も `null` | `libs/server/me.ts` を読む | `if (response.status === 401) return null; if (!response.ok) return null;` |
| `profile` と `profile/edit` が、このレイアウトの下にある | `app/(main)/(authenticated)/profile/` を列挙 | `page.tsx` が `UserProfile` / `EditUserProfile` を返す |
| `app/` に `error.tsx` が無い | `ls` | 無い |
| `EditUserProfile` は `getPrefectures()` を `!user` の判定より前に呼ぶ | `EditUserProfile/index.tsx` を読む | そのとおり |
| `getPrefectures` は 401 で例外を投げる | `libs/server/backend/fetch.ts` を読む | `BackendUnauthorizedError` を投げる |
| `if (!user)` の分岐を持つ `index.tsx` は、この2つだけ | `grep "if (!user)" features` | そのとおり |

### 未検証の前提

| 前提 | 確かめる方法 |
| --- | --- |
| クライアント遷移では共有レイアウトが再描画されず、セッション切れ後にプロフィールへ遷移すると、ページの `!user` がスピナーで止まる(推測。Next.js の仕様に基づく) | 実画面で確かめる(開発サーバーと生徒アカウントが要る。オーナーの了承を得てから)。**手順**: (1) 通常のページ(例: ダッシュボード)に、ログインした状態で開く。(2) Cookie を削除する。**このあと、画面を読み込み直さない**(読み込み直すと、レイアウトの `redirect` が効いてしまい、偽の「問題なし」になる)。(3) 画面内の `Link` または `router.push` で、`/profile` と `/profile/edit` へ遷移する。(4) 遷移後の Network に、RSC のリクエストが出ていることを確かめる(出ていなければ、prefetch やキャッシュで再取得されていないので、確認として無効)。**別項目**: `/profile` と `/profile/edit` を URL で直接開き、レイアウトの `redirect("/login")` が効くことを確かめる(これは「レイアウトのガードの確認」であって、ページの `!user` の確認ではない) |
| クライアント遷移で `/profile/edit` に来たとき、`getPrefectures` の 401 の例外に届く(「401 のとき例外を投げる」こと自体は、上の検証済みの表のとおり) | 上の手順で、`/profile/edit` へクライアント遷移して確かめる。単体テストでは、`getPrefectures` を 401 の例外にしたときの結果を確かめる |

## 設計

- `UserProfile` / `EditUserProfile` の `if (!user)` を、静的なスピナーではなく **`redirect("/login")`** にする(親のレイアウトと同じ扱いに揃える)。`CircularProgress` と `Box` の import を消す。
- `EditUserProfile` では、**`!user` の判定を `getPrefectures()` の呼び出しより前に移す**(2行の並べ替え)。これで、セッション切れのとき `getPrefectures` の例外に届く前に `/login` に遷移し、未ログインのときに都道府県を取りにいく無駄もなくなる。
- 次は、このチケットでは**変えない**(下の「その他」に事実として記録する)。
  - `getPrefectures()` 自体の失敗(5xx など)で既定のエラー画面になること。
  - 同じ `/api/v1/me` をレイアウトとページで2回取ること(`cache()` での共有)。
  - 401 と 5xx を区別しないこと。

### 利用者に見える変化とデメリット

- メリット: セッション切れや一時的な失敗のとき、スピナーのまま止まらず、ログイン画面に遷移する。
- **デメリット(許容する)**: バックエンドの一時障害のときも、ログイン済みの生徒がログイン画面に飛ばされる(再読込で復帰できたはずの場合も)。親のレイアウトがすでに同じ挙動なので、ここだけ違う挙動にはしない。Go 移行などで `/me` の扱いを見直すときに、レイアウトとまとめて直す。

## 判断: チケットにする

変更は実質2ファイルの数行で、独立したチケットにするコストは小さい。チケットにする理由は次のとおり。

- クライアント遷移でセッション切れのときにスピナーで止まるなら、**利用者に見える不具合の修正**になる(未検証)。
- 止まらないと分かった場合も、「親のレイアウトと揃う」「`EditUserProfile` の `getPrefectures` の順序の問題を直す」「`CircularProgress` を `index.tsx` から除ける」という価値は残る。
- TSK-216 の許可リストに恒久的な例外を増やさない。TSK-216 の中で2行直す案は、TSK-216 の PR を大きくし、この画面のテスト・追跡も混ざる。

## 比較した案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| A: `redirect("/login")` に揃える | 採用 | 親のレイアウトと同じ扱いで、スピナーのまま止まらない。変更が小さく、サーバーコンポーネントのまま |
| B: `ErrorState` + 再読込ボタンを出す(小さなクライアントコンポーネントを足す) | 不採用 | 5xx の一時的な失敗なら再読込で復帰できるが、レイアウトが 5xx でも `/login` に飛ばす現行の挙動と、ここだけ違うことになる。部品も増える |
| C: `getMeFromBackend` の結果を `cache()` でレイアウトとページで共有する | 不採用(別件) | 取得の二重化の解消にはなるが、範囲を超える。クライアント遷移でレイアウトが動かない問題は、`cache()` では直らない |
| D: 許可リスト(TSK-216)に恒久的に載せる | 不採用 | 恒久的な例外が2つ増える |
| E: このチケットを作らず、TSK-216 の中で2行直す | 不採用 | 上の「判断」のとおり |
| F: `getPrefectures` の失敗も、このチケットで `redirect` や `ErrorState` にする | 不採用(別件) | 401 以外の失敗の見せ方(エラー画面)の設計が要る。`error.tsx` の追加なども絡む |

## やること

- [ ] `UserProfile` / `EditUserProfile` の `!user` を `redirect("/login")` に変える
- [ ] `EditUserProfile`: `!user` の判定を `getPrefectures()` より前に移す
- [ ] テスト(サーバーコンポーネントの単体テスト。`next/headers` の `cookies`・`getMeFromBackend`・`getPrefectures` をモックし、`next/navigation` の `redirect` を「呼ばれたら例外を投げる」モックにして、`rejects` で確かめる。`mockResolvedValueOnce` の消化漏れで他のテストに影響しないよう、`beforeEach` で `mockReset` する):
  - Red: `getMeFromBackend` が `null` のとき `/login` に `redirect` される(現行はスピナーを返す)
  - Red: `EditUserProfile` で `getMeFromBackend` が `null` のとき、`getPrefectures` が呼ばれず `redirect` される(現行は呼ぶ)
  - **Red のコミットの前に、この2本が実際に失敗することを確かめる。** `redirect` を呼ばずにスピナーを返す現行では、`rejects` を使ったテストは「resolve してしまって失敗」する(偽陽性にならないことの確認)。`redirect` モックが投げる例外は、ページ側で握りつぶさない
  - 回帰防止: `user` があるときは、これまでどおり `Presenter` / `Container` を描画する
- [ ] `CircularProgress` と不要な import を消す
- [ ] (オーナーの了承があれば)実画面確認。**修正前に現行のブランチで再現を取り**(期待: `/profile` はスピナーで止まる、`/profile/edit` は既定のエラー画面)、**修正後に `/login` に遷移する**ことを確かめる。修正前に再現できなければ、推測が外れたと分かるので、背景の記述を直す。了承がなければ、PR 説明に「未検証」と書く
- [ ] TSK-216 が未マージなら、マージ時に許可リストから外すことを TSK-216 側にコメントする(マージ済みなら外す)
- [ ] 「その他」に、`getPrefectures` の失敗(401 は例外 → 既定のエラー画面)・`/me` の二重取得・401 と 5xx の非区別を、事実として書く

## 完了条件

- [ ] 2つの `index.tsx` に `CircularProgress` が残っていない
- [ ] `getMeFromBackend` が `null` のとき、スピナーのまま止まらず `/login` に `redirect` される(単体テストで確認)
- [ ] `EditUserProfile` は、`!user` のとき `getPrefectures` を呼ばない(単体テストで確認)
- [ ] 実画面での確認は、オーナーの了承が得られた場合に行い、結果を PR 説明に書く。行わなかった場合は「未検証」と明記する。手順は未検証の前提の表のとおり(**通常ページから Cookie を消して、読み込み直さずにクライアント遷移する**。URL の直接入力は、レイアウトの `redirect` の確認として別項目)
- [ ] `npm run test` / `lint` / `format:check` / `typecheck` が通る

## その他(別件として記録する事実)

- `/api/v1/me` を、レイアウトとページで2回取っている。
- `getMeFromBackend` は 401 と 5xx を区別しないため、一時障害でもログイン画面に飛ぶ。直すときは、レイアウトを含めて見直す。**別チケットにするかは、オーナーの判断**(起票するなら、Go 移行の見直しとまとめるかも含めて決める)。
- `getPrefectures()` の失敗は、401 で `BackendUnauthorizedError`、それ以外で `BackendFetchError` の例外になり、`app/` に `error.tsx` が無いため、既定のエラー画面になる。

## 依存

- 他のチケットには依存しない
