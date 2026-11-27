# [Rails] お知らせの配信先配列のキー名を announcement_targets に統一する

## 概要

同じ配信先の配列が、管理者の高校別お知らせ一覧のレスポンスでは `targets`、教員のお知らせ編集のレスポンスでは `announcement_targets` と別のキー名で返っている。管理者側を `announcement_targets` に改名して揃える。

利用者に見える変化はない（フロントは管理者側の `targets` を読んでいない）。得をするのは開発チームで、同じ配信先に 2 つの名前があることで起きる読み違い・取り違えをなくし、Go 移行の設計書（Rails の実レスポンスと突き合わせる工程がある）と実装が食い違うのを防ぐ。

本番環境がまだ無いので、API のキーを変えるのは今が最も安い（本番ができたあとは破壊的変更になる）。本番が無く、外から使う者もいないことは、オーナーに確認済み（2026-11-26）。

デメリットもある。これまでは名前が違うことで気づけた「管理者は高校で絞った行・教員は全行」「`user_name` の有無」という違いが、改名で見えにくくなる。serializer のコメントと PR 説明の表で補う。

## 背景(調査結果)

- 管理者: `GET /api/v1/admin/high_schools/:high_school_id/announcements`（`admin/high_schools/announcements_controller.rb`）が `Admin::AnnouncementSerializer` で `targets` を返す
- 教員: `GET /api/v1/teacher/announcements/:id/edit`（`teacher/announcements_controller.rb#edit`）が `announcement_targets` を返し、フロント（`features/teacher/AnnouncementEditor/Presenter.tsx`）が読んでいる
- 教員の作成・更新のリクエストも `announcement_targets`（`announcement: { announcement_targets: [...] }`）。DB のテーブル名・モデルの関連名も `announcement_targets`。`targets` だけが例外
- 2 つのレスポンスは、キー名のほかに次の点が違う（このチケットでは揃えない。理由は「設計」）

  | 観点 | 管理者（`Admin::AnnouncementSerializer`） | 教員（`#edit`） |
  |---|---|---|
  | 要素の項目 | `id, target_type, high_school_id, grade_id, user_role_id, user_id` | 左に加えて `user_name`（`Teacher::AnnouncementTargetSerializer`） |
  | 対象の行 | 指定した高校宛ての行だけ（`high_school_id` で絞る） | そのお知らせの全行 |

### 検証済みの前提

| 前提 | 確かめた方法 |
|---|---|
| `Admin::AnnouncementSerializer` の利用箇所は管理者の高校別お知らせ一覧の 1 か所だけ | `rails/app`・`rails/spec` を `AnnouncementSerializer` で grep。管理者のダッシュボードは `Admin::DashboardAnnouncementSerializer`、お知らせ一覧は `Admin::AnnouncementListSerializer` で別 |
| フロントは管理者の高校別一覧の `targets` を読んでいない | `frontend` の `.ts`・`.tsx` を `\btargets\b` で grep（2026-11-26）。該当は `features/teacher/AnnouncementEditor/` 配下だけで、フォームの入力値の名前（`values.targets`）であり API の応答ではない。管理者側の型 `features/admin/SchoolDetail/types.ts` の `Announcement` に配信先の項目は無い |
| Next.js の中継は応答をそのまま流す | `app/api/admin/schools/[schoolId]/announcements/route.ts` は `backendFetch` の `data` を `NextResponse.json` に渡すだけで、キー名に依存しない |
| 既存の spec で `targets` を見ているのは管理者の高校別一覧の request spec だけ | `rails/spec` を grep。`spec/requests/api/v1/admin/high_schools/announcements_spec.rb` の 64・75〜88 行目 |
| `Admin::AnnouncementSerializer` の serializer spec は無い | `rails/spec/serializers/admin/` には `announcement_detail`・`announcement_list`・`dashboard_announcement` の 3 つだけ |
| 本番環境は無く、この API を外から使う者もいない | オーナーに確認した（2026-11-26）。これが崩れる場合は、案 C（移行期間だけ 2 つのキーを併存）を見直す |
| 仕様書・docs・API 定義に `targets` の記述は無い | リポジトリ全体を `git grep`（spec・教員側のフロント・`docs/reviews` を除く）して該当なし。`swagger`・`openapi` 系のファイルも無い（2026-11-26） |
| 教員側の `announcement_targets` は変えなくてよい | `rails/spec/requests/api/v1/teacher/announcements_spec.rb` が `announcement_targets` を前提にしている。リクエストのキーとも一致する |

### 未検証

- **Go 移行設計（①②③）の該当記述の場所**: Notion の「設計書まわり 反映状況(2026-11-02 時点)」によると、①②③は別のリポジトリ（Go 側）の `計画書/` 配下にあり、このリポジトリにも Notion のチケットにも無い。チケットの備考にある「該当機能の記述」が、どのリポジトリのどのファイル（候補: 管理者お知らせ管理機能、管理者高校学年参照機能の ②③）かは確かめられていない。確かめ方: 持ち主に聞く
- **`ActiveModel::Serializer`（0.10.16）で、`attributes :announcement_targets` と、同名のメソッド定義が併存してよいか**: メソッドが優先されて動く見込みだが、実装時に request spec で確かめる。動かなければブロック形式の属性（`attribute :announcement_targets do ... end`）に切り替える
- **既存の request spec が、いまの main で通るか**: この環境では Docker が止まっていて Ruby 3.4.12 も無く、実行できなかった。実装の最初に実行して、Red の前の状態を確かめる
- **Go 移行設計の持ち主と置き場所**: 確認用の別チケットを Notion のカンバンに起票し、そこで確認する（オーナーが 2026-11-26 に了承）

## 設計

1. `Admin::AnnouncementSerializer` の属性とメソッド名 `targets` を `announcement_targets` に改名する。中身（高校で絞る処理・`AnnouncementTargetSerializer`）は変えない。メソッドの中で関連を読むときは、必ず `object.announcement_targets` と書く（`announcement_targets` と書くと自分自身を呼んで再帰する）
2. request spec を新しいキーに直す。「`announcement_targets` が配列で返る」と、「`targets` は返らない（`not_to include`）」を別の例にする（二重に返す事故を防ぐ。どちらも今の実装では Red になる）
3. 「指定した高校宛ての行だけ」という違いが、改名後に同じキー名の下で見えなくなる。serializer に 1〜2 行のコメントを書き、PR 説明に上の違いの表を載せる（既存の spec「他校をターゲットにした行は含まれない」はキー名だけ直して残す）
4. フロントは変更しない。実装時に同じ grep をもう一度かけて、参照が増えていないことを確かめる
5. Go 移行設計の記述は、このチケットのコード変更に含めない（所在が未確認で、別のリポジトリのため）。このチケットでは、PR 説明に「Rails のレスポンスのキーが変わった」こと・影響先の候補（管理者お知らせ管理機能、管理者高校学年参照機能の ②③）・違いの表を書き、確認は別チケットか Go 側の Issue で追う
6. serializer spec は足さない。高校で絞る振る舞いは request spec で確かめており、対象は 1 serializer・1 エンドポイントなので、足すと二重になる

### 比較した案

| 案 | 採否 | 理由 |
|---|---|---|
| A. 管理者側を `announcement_targets` に改名（チケットの案） | **採用** | 影響はサーバーの 1 serializer と 1 spec だけ。リクエスト・DB・モデルの名前と揃う |
| B. 教員側を `targets` に改名 | 不採用 | フロント（`Presenter.tsx`・型・route test・Presenter test）と request spec の広い範囲が変わる。リクエストは `announcement_targets` のままなので、同じ配信先が「送るときと受け取るときで名前が違う」状態になる |
| C. 移行期間だけ 2 つのキーを両方返す | 不採用 | 管理者側の `targets` を読む利用者がいないので、移行期間を設ける理由がない |
| D. 配信先の serializer を教員と管理者で共通にして、形まで揃える | このチケットでは不採用 | `user_name` を管理者側にも返すと、`includes(:user)` が要り、管理者の一覧に使わない項目と問い合わせが増える。必要になったら別チケット |
| E. 何もせず、違いを文書にだけ残す | 不採用 | 食い違いが残り、Go 設計の突き合わせ工程でも毎回引っかかる |
| F. 管理者側の「高校で絞る」処理を、`scoped_announcement_targets` のような別の名前の処理に切り出す | 不採用 | 改名の範囲を超えて規模が増える。違いはコメントと PR 説明で補えるので、この PR では足さない |

## やること

TDD（Red → Green）で進める。

0. 変更の前に、既存の request spec が main で通ることを確認する（この環境では未確認）
1. request spec（`spec/requests/api/v1/admin/high_schools/announcements_spec.rb`）を直す（Red を確認）
   - 必須項目の一覧に `announcement_targets` を入れ、`targets` を外す
   - 「`announcement_targets` が配列で返される」「`targets` は返らない」
   - 「他校をターゲットにした行は `announcement_targets` に含まれない」
2. `Admin::AnnouncementSerializer` を改名し、コメントを足す（Green を確認）
   - 「他校の行を含まない」の例が、キー不在の例外ではなく絞り込みの失敗でも落ちることを確かめる。Green のあと、`high_school_id` の絞り込みを一時的に外して例が落ちることを見て、元に戻す（コミットしない）
3. `bundle exec rspec spec/requests/api/v1/admin/high_schools/announcements_spec.rb`、`bundle exec rspec`（全体）、`bundle exec rubocop`
4. `frontend` を grep して、管理者側の `targets` 参照が無いことを確かめる（下の完了条件のコマンド）。フロントは変更しないので、フロントの CI（`frontend/**` の変更でだけ動く）は走らない
5. PR 説明に、キー名が変わったこと、違いの表、影響先の候補（Go 設計書）を書く。Go 設計書の確認用に、既定では Notion のカンバンに別チケットを起票する（Go 側の Issue に移すかはオーナーの判断）

## 完了条件

- [ ] 管理者の高校別お知らせ一覧が `announcement_targets` を返し、`targets` は返さない（request spec）
- [ ] 他校宛ての行が含まれないことが、新しいキーでも確かめられている（request spec）
- [ ] 教員のお知らせ編集のレスポンスと、フロントのコードに変更がない（`git diff origin/main...HEAD -- frontend` が空）
- [x] 着手前: 本番環境が無く、外から API を使う者がいないことをオーナーに確認済み（2026-11-26。PR 説明にも書く）
- [ ] 管理者側のフロントが `targets` を読んでいない: `grep -rnw targets frontend --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=.next` の結果が、`features/teacher/AnnouncementEditor/` 配下だけである
- [ ] 管理者側の応答と docs に旧キーが残っていない: `grep -rnw targets docs rails/app/serializers rails/app/controllers --exclude-dir=reviews` の結果が 0 件（改名前は `admin/announcement_serializer.rb` の 2 行だけ。`rails/app/services` の局所変数 `targets` は別物なので対象に含めない）
- [ ] Rails の CI（rspec・rubocop）が通る（フロントを変えないので、フロントの CI は動かない）
- [ ] PR 説明に、キー名の変更・違いの表・影響先の候補（Go 設計書）が書かれている
- [ ] Go 設計書の確認用に、Notion のカンバンの別チケット（オーナーが Go 側の Issue を選べばそちら）を起票してある（ID を PR 説明に書く。返事は待たない）

### 元の受け入れ条件からの変更（Notion に反映するとき本文に明記する）

- 「serializer spec」: 足さない。request spec で足りる（設計 6）
- 「フロントのテスト・型チェックが通る」: grep と `git diff` に置き換える。フロントを変えない PR ではフロントの CI が動かず、通ったことの証拠にならない
- 「Go 移行設計の記述もあわせて直す」（備考）: このチケットでは直さず、所在の確認を別に起票する

## 依存

- なし。Rails の 1 serializer と 1 spec だけを変える
- 近い時期に起票された API の形の統一チケット（管理者のお知らせ作成レスポンスに `announcement_id` を追加、管理者の教員タブのレスポンス構造の統一）とは、変更するファイルが別（前者は `admin/announcements_controller`、このチケットは `admin/high_schools/announcements_controller` が使う serializer）。順序の制約はない
