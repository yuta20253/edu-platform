# [Rails] テスト環境で Bullet を有効にし、N+1 を CI で検知する

## 概要

Bullet は development 環境でしか有効になっておらず、CI(テスト環境)では N+1 を検知できていない。そのため、`includes` を消すなどの回帰があっても、レスポンスが同じならテストは通ってしまう。テスト環境でも Bullet を有効にし、関連の読み込みで N+1 が入った PR を CI で落とせるようにする。あわせて、今あるテストで見つかる N+1 を直す。教師の生徒一覧とお知らせ作成画面では、生徒ごとに出ていた都道府県のクエリが 1 本にまとまる。

検知の対象は request spec で、1 回のリクエストで 2 件以上を読み込む例だけ。ジョブ・サービス・model の spec と、集計クエリの N+1 は対象外。集計クエリの N+1 は既存の明示的なテストで守られているが、ジョブ・サービスの N+1 は今も守られておらず、このチケットでも対象外のままにする。

## 背景(調査結果)

- TSK-200 / PR #187 で `GET /api/v1/student/dashboard` の N+1 を直し、回帰を防ぐためにクエリ数を数えるテストを足した。この書き方は SQL の文字列(MySQL のバッククォート)に依存していて壊れやすく、エンドポイントごとに書くと保守の手間も増える
- `Gemfile` の `group :development, :test` に `bullet` がある(`Gemfile.lock` は 8.1.3、Rails は 7.2.3.2)。有効にしているのは `config/environments/development.rb` だけで、`test.rb` と `spec/rails_helper.rb` には設定が無い
- クエリ数を数えるテストは約 16 件ある。共通のヘルパー `spec/support/query_counter.rb`(`capture_queries`)を使うものと、各 spec で `ActiveSupport::Notifications.subscribed(..., 'sql.active_record')` を直接書くものがある
- main にはブランチ保護が無く、Rails CI は必須チェックではない(CI チケットで「今はしない」と決めた)。CI で落ちてもマージは止まらず、レビューで赤を見る運用に頼る
- Bullet が検知するのは、関連(`belongs_to` / `has_many` など)を 1 件ずつ読み込む N+1 と、counter cache の使い忘れだけ。レコードごとに自前の `where` / `count` / 集計クエリを出す N+1 は検知しない。また、1 回のリクエストで 2 件以上読み込んだレコードしか対象にしない

### 検証済みの前提

確かめ方: `rails/tmp`(git の管理外)に計測用の設定を置き、`bundle exec rspec -r ./tmp/bullet_probe.rb` で読み込んだ。リポジトリのファイルは変えていない。設定は `Bullet.enable = true`、`raise = false`、`bullet_logger = true`、`unused_eager_loading_enable = false`。

| 前提 | 確かめた方法 |
|---|---|
| request spec では、Bullet の Rack ミドルウェアが HTTP リクエストごとに計測を区切って検知する | `bullet-8.1.3/lib/bullet.rb` の Railtie が `Bullet::Rack` を常に追加している(`api_only` なので `app.middleware.use`)。`Bullet::Rack#call` は `Bullet.enable?` のときだけ `start_request` → アプリ → 通知 → `end_request` を行う |
| テスト内で factory を使って作ったレコードは、同じ計測範囲の中では検知の対象外になる | わざと N+1 を起こすテスト(`InterviewRequest.all.each { _1.student }`)では、`Bullet.notification?` が false だった。データを作ったあとに `end_request` → `start_request` し直すと true になった(`InterviewRequest => [:student]`) |
| そのため、`rails_helper` で `before(:each) { Bullet.start_request }` しても、request spec 以外(model・service・query の spec)ではほとんど検知できない | 上と同じ。factory で作る → 同じ範囲で読み込む、という流れになるため |
| 既存のテスト全件(2352 件)で見つかる違反は 3 種類だけ | 全件を流して `log/bullet.log` を集計した。① `Address => [:prefecture]` 17 件(`AddressSerializer#prefecture`。`Teacher::AnnouncementsController#new` と `Teacher::StudentsController#index` から。どちらも `Teacher::StudentsQuery#students` を通る)② `HighSchool => [:grades]` 1 件(`Teacher::GradesController#index`。`current_user.high_school.grades` は高校 1 件の関連なので、N+1 ではなく誤検知の見込み。要確認)③ `Goal => [:tasks]` の「Need Counter Cache」5 件(`GET /api/v1/teacher/students/:id`、N+1 ではない) |
| `Bullet.enable = true` は safelist を空に戻す | `bullet-8.1.3/lib/bullet.rb` の `enable=` が `reset_safelist` を呼ぶ |
| 2 件以上のデータを作っているのは、多くがクエリ数テストの例だけ | `teacher/interview_requests_spec.rb` で `create_list(:interview_request, 3, ...)` を使うのはクエリ数テストの例だけ。他の spec も作業時に `create_list` / `times` で確かめる |
| 関連の読み込みを見ているクエリ数テストは、Bullet で代われる | `Teacher::InterviewRequestsController` の `includes(:student, :teacher)` を一時的に外して `teacher/interview_requests_spec.rb` を流すと、既存のクエリ数テストが落ち、Bullet も `InterviewRequest => [:student]`・`[:teacher]` を 5 回ずつ記録した(確認後すぐ元に戻した) |

### 未検証

- **`Bullet.raise = true` の例外が request spec まで届いてテストが落ちるか**: `config/environments/test.rb` は `show_exceptions = :rescuable`(確認済み)なので、`Bullet::Notification::UnoptimizedQueryError` は 500 に変換されずテストに届く見込み。作業の最初に、`includes` を 1 つ外して落ちることを確かめる
- **表の「要確認」のテストが Bullet で代われるか**: 上の確かめ方(`includes` を外して流す)で 1 つずつ確かめる

| テスト | 見ているもの | Bullet で代われるか |
|---|---|---|
| `student/dashboards_spec.rb`「tasksの取得でN+1が発生しない」 | 関連の読み込み | 代われる見込み |
| `student/interview_requests_spec.rb`・`teacher/interview_requests_spec.rb`「usersへのクエリ件数が増えない」 | 関連(student / teacher)の読み込み | 代われる(teacher で確認済み) |
| `student/interview_request_messages_spec.rb`・`teacher/interview_request_messages_spec.rb` | 関連(sender)の読み込み | 代われる見込み |
| `teacher/school_class_requests_spec.rb`「件数によらずクエリ件数が増えない」 | 総クエリ数を基準の件数と比べている(SQL 文字列に依存しない) | 代われない(関連以外の N+1 も見ている) |
| `teacher/import_histories_spec.rb`(show・export の 2 件) | 入れ子の関連 3 つ(`imported_students.user`・`user.grade`・`user.school_class`)と `import_errors` | 要確認(関連ごとに確かめる。`import_errors` は 1 件の履歴の has_many なので N+1 ではない) |
| `teacher/import_histories_spec.rb`「一覧では imported_students / import_errors を読み込まない」 | 読み込まないこと(N+1 ではない) | 代われない |
| `teacher/students_spec.rb`「tasksの取得は1クエリ」「解答履歴と問題数の集計は1クエリずつ」 | 集計クエリの本数 | 代われない |
| `admin/courses_spec.rb`(4 件) | 集計クエリの本数・発行しないこと | 代われない |
| `queries/task_answer_stats_query_spec.rb`(2 件)・`services/common/task_progress_service_spec.rb` | 集計クエリの本数 | 代われない |
| `queries/admin/analytics_query_spec.rb`「unitsへのSELECTが1本」 | 集計クエリの本数 | 代われない |
| `models/import_history_spec.rb`「preload しても追加クエリなし」 | preload 後の並び順 | 代われない |
| `serializers/teacher/student_task_serializer_spec.rb`・`student_goal_serializer_spec.rb` | 読み込み済みの関連を使うこと | 代われない(request の外なので Bullet が見ない) |

## 設計

1. `config/environments/test.rb` で Bullet を有効にする

   ```ruby
   config.after_initialize do
     Bullet.enable                      = true
     Bullet.bullet_logger               = true
     Bullet.raise                       = true  # N+1 を検知したら例外にしてテストを落とす
     Bullet.unused_eager_loading_enable = false # 使っていない includes は今回は対象外(ノイズを減らす)
     Bullet.counter_cache_enable        = false # counter cache の提案は N+1 ではないので対象外
     # safelist はここ(Bullet.enable = true の後)に書く。enable= が safelist を空に戻すため
   end
   ```

2. 検知は request spec(Rack ミドルウェア)に任せ、`rails_helper` に `Bullet.start_request` / `end_request` のフックは入れない。テスト内で作ったレコードが対象外になるため、request spec 以外ではフックを入れてもほとんど検知できず、効いているように見えるだけになる
3. 全件の計測で見つかった違反に対応する
   - `Address => [:prefecture]`: `Teacher::StudentsQuery#students` の `includes` を `address: :prefecture` にする。生徒一覧とお知らせ作成の両方に効く。`Teacher::CreateInterviewRequestForm` も同じ Query を使うので都道府県の preload が 1 クエリ増えるが、許容する
   - `HighSchool => [:grades]`: 原因を特定する → 原因の読み込みが不要なら直す → 直せない、または直す得が無いときだけ `Bullet.add_safelist type: :n_plus_one_query, class_name: 'HighSchool', association: :grades` で外す。safelist はアプリ全体に効くので、コメントに原因と「HighSchool を複数件並べて grades を引く画面を作るときは外すこと」を書く
4. クエリ数テストは、テストの型で扱いを分ける。テーブル名を grep して件数を見る型(`FROM \`users\`` など、SQL 文字列に依存する)で、関連の N+1 を見ているものだけを書き換え対象にし、クエリ数の数え方(`subscribed` / `capture_queries` と件数の `expect`)だけを外し、「複数件あっても全件を返す」例として残す。Bullet は 2 件以上を読み込まないと検知しないので、複数件のデータを作る例そのものが守りになる。総クエリ数を基準と比べる型(SQL 文字列に依存せず、関連以外の N+1 も拾う)と、集計クエリの本数を見ている型は今のまま残す

- `.github/workflows/rails-ci.yml` は `bundle exec rspec` をそのまま流しているので変えない

## 比較した案

| 案 | 内容 | 採用しない理由 |
|---|---|---|
| A(採用) | `test.rb` で有効にし、request spec の検知は Rack ミドルウェアに任せる | ― |
| F | `ApplicationJob` に `Bullet::ActiveJob` を入れ、ジョブの N+1 も検知する | ジョブの N+1 を守るテストは今は無く、価値はある。ただ bullet は production の Gem グループに無いので `include Bullet::ActiveJob if defined?(Bullet)` の工夫が要り、通知系ジョブの spec が 2 件以上のデータを作っているかの確認も要る。別チケットの候補にする |
| B' | 関連の読み込みを見ているクエリ数テストを消す(当初の案) | 多くのエンドポイントで、2 件以上のデータを作る例はクエリ数テストだけ。消すと Bullet が検知する機会も無くなり、黙って通るようになる |
| B | A に加えて `rails_helper` で `before(:each) { Bullet.start_request }` / `after(:each) { … end_request }` を入れる(当初の案) | テスト内で factory を使って作ったレコードは同じ計測範囲では対象外になり、request spec 以外ではほとんど検知できない(検証済み)。request spec は Rack ミドルウェアが計測を区切り直すので、フックが無くても検知できる |
| C | まず `Bullet.raise = false`(ログだけ)で入れ、あとで `true` にする | 既存の違反は 3 種類だけで、このチケットで直せる量なので、最初から `true` にする |
| D | Bullet を入れず、クエリ数テストを増やし続ける | SQL 文字列に依存して壊れやすく、エンドポイントごとに書く手間がかかる。関連の N+1 は Bullet のほうが漏れなく見られる |
| E | `unused_eager_loading` も有効にする | 使っていない `includes` の検知は N+1 とは別の関心事で、警告が増える見込み。必要になったら別チケットで |

## やること

- [ ] `config/environments/test.rb` に Bullet の設定を足す(設計 1)
- [ ] 確認: `includes` を 1 つ外すと、その request spec が `Bullet::Notification::UnoptimizedQueryError` で落ちる(`raise` がテストまで届く)ことを確かめて、元に戻す
- [ ] `bundle exec rspec` を流し、落ちたテストを確かめる(計測では 3 種類。counter cache は設定で外すので、N+1 の 2 種類が落ちる見込み)
- [ ] `Address => [:prefecture]` を直す(`Teacher::StudentsQuery#students` の `includes` を `address: :prefecture` に)
- [ ] `HighSchool => [:grades]` の原因を特定する(30 分を目安に区切る)。不要な読み込みなら直し、直せない・直す得が無いとき、または 30 分で原因が分からないときは、原因(または原因不明であること)と外すきっかけをコメントに書いて safelist に入れる
- [ ] 誤検知があれば `Bullet.add_safelist` で個別に外し、理由をコメントで残す
- [ ] テーブル名を grep する型のクエリ数テスト(表の「代われる」「要確認」)を、数え方だけ外して「複数件あっても全件を返す」例に書き換える。it 名は「複数件でも全件を返す(N+1 は Bullet が検知する)」に揃え、`# Bullet は 2 件以上を読み込んだときだけ N+1 を検知する。件数を 1 にしないこと` のコメントを残す。作った件数がレスポンスに全部含まれることを `expect` する(例: `ids` が `contain_exactly(*messages.map(&:id))`、CSV なら全員の名前を含む)。書き換えた後の spec で、**テストが守っている関連ごとに**、その関連だけを `includes` から一時的に外して Bullet が落とすことを確かめる(例: `user: %i[grade school_class]` から `grade` だけ外す)。1 つでも落ちなければ(複数件になっていない、入れ子の先が 1 件ずつ読まれるなど)、そのテストはクエリ数テストのまま残す
- [ ] コミットは「Bullet の有効化と違反の対応」と「クエリ数テストの書き換え」に分け、PR 本文の表で書き換えた・そのまま残したテストと理由を示す
- [ ] `bundle exec rspec`・`bundle exec rubocop` が通ることを確かめる
- [ ] Bullet あり・なしで rspec 全体の所要時間を比べ、PR 本文に書く

## 完了条件

- テスト環境で Bullet が有効で、2 件以上を読み込む request spec に関連の N+1 が入ると CI(rspec)で落ちる(`includes` を外して落ちることを 1 か所以上で確かめた)。ジョブ・サービス・集計の N+1 は対象外であることが PR に書いてある
- 既存のテストがすべて通る(N+1 を直した、または理由つきで safelist に入れた)
- 書き換えたクエリ数テストは、書き換えた後に `includes` を外すと Bullet で落ちることを確かめたものだけ。そのまま残したテストの理由が PR に書いてある

## 依存

- 依存: Ruby を 3.4.12 に上げて Rails CI を直すチケット(TSK-228)
  - 着手はすぐできる(`raise` がテストに届くこと・`includes` を外して落ちることは、ローカルの rspec で確かめられる)
  - マージと、CI で赤になることの確認は、CI チケットの PR がマージされたあと
- 関連(別チケット候補): `Bullet::ActiveJob` でジョブの N+1 も検知する(比較した案 F)

## 設計レビュー記録

`docs/reviews/2026-10-24_TSK-201_bullet_test_env/`
