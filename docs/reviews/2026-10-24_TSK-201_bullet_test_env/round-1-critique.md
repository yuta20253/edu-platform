# 批判：テスト環境で Bullet を有効にし、N+1 を CI で検知する（第1周）

## 総評
調査はしっかりしています。Bullet の Rack ミドルウェアがリクエストごとに計測を区切ることを gem のソースで確かめ、元の案にあったフック（案 B）が効かないことも示せています。ただ、穴が 2 つあります。1 つは、消す予定のクエリ数テストこそが「2 件以上のデータ」を作っている唯一の場所だという点。もう 1 つは、「N+1」として直す予定の `HighSchool => [:grades]` がおそらく N+1 ではない点です。

## 判定
直せば進めてよい
（土台の設計（案 A）は正しいです。ただ「消すテスト」と「直す違反」の 2 か所で、このまま進めると守りが黙って弱くなるか、意味のない修正が入ります）

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒・教師・管理者） | 教師の生徒一覧（`GET /teacher/students`）とお知らせ作成画面（`GET /teacher/announcements/new`）で、1 ページ分（per_page 件）の都道府県クエリが 1 本にまとまり、少し速くなる。今後の関連の N+1 が本番に出にくくなる（間接的） | 見た目や挙動は変わらない。消したクエリ数テストが守っていた N+1 が将来戻った場合、教師・生徒の一覧（面談申請・メッセージ・ダッシュボード）が遅くなる（指摘1） |
| 開発チーム | SQL 文字列に頼らない N+1 の回帰検知が入る。新しいエンドポイントにも追加の手間なく効く（2 件以上のデータがあれば） | 誤検知で CI が落ち、safelist の手間が出る。検知されるかどうかがテストデータの件数しだいで、外から見えない。Go 移行で Bullet は無くなる（投資の寿命が限られる） |

- 両方にメリットがあるか：ある（利用者へのメリットは小さいが、損はない）
  ただし草案には利用者の観点が 1 行も無いです（草案に無い）。教師の 2 画面のクエリが減ることを書いてください。
- やらないことのデメリット：
  - 利用者が失うもの：教師の生徒一覧とお知らせ作成の N+1（都道府県）が残る。数百人規模で per_page 件なので、影響は小さいです
  - 開発チームが失うもの：関連の N+1 の回帰は、クエリ数テストがある約 6 か所でしか検知できず、新しいエンドポイントは無防備なまま
- 草案に書かれていなかったメリット・デメリット（すべて草案に無い）：
  - 利用者のメリット（上記）
  - main にブランチ保護が無い（CI チケットの草案で確認）。そのため「CI で落とす」はマージを止めず、赤い表示が出るだけ
  - Go 移行で Bullet は無くなる。そのとき「どのエンドポイントが N+1 に弱いか」を示すのは、明示的なテストのほう（指摘1）

## 確かめた事実
- `bullet-8.1.3/lib/bullet/rack.rb`：`call` は `Bullet.enable?` のときだけ `start_request`、アプリの実行、`perform_out_of_channel_notifications`（raise はここで起きる）、`ensure end_request` の順に動く。草案のとおり
- `lib/bullet.rb` の Railtie：`api_only` なので `app.middleware.use Bullet::Rack`（スタックの末尾、ShowExceptions の内側）。raise はコントローラの外のミドルウェアで起きるので、`ApplicationController` の `rescue_from` にも捕まらない。`show_exceptions = :rescuable`（test.rb 32 行目）なら、rescue_responses に無い例外はテストまで届く見込みで、草案の推論は妥当です。実際に確かめる手順も入っています
- `Bullet.enable=` は `reset_safelist` を呼ぶ（bullet.rb 66〜70 行目）。safelist は `enable = true` の後に書く必要がある（指摘5）
- `Address => [:prefecture]` の 2 か所は、どちらも `TeacherStudentsScope#students_scope` → `Teacher::StudentsQuery#students`（`includes(:grade, :address, :high_school, :user_personal_info)`）を通る。直す場所は 1 か所です（指摘3）
- `GradesController#index` は `current_user.high_school.grades` をそのまま render している。高校は 1 リクエストに 1 件なので、grades は件数によらず 1 クエリ（指摘2）
- `teacher/interview_requests_spec.rb` 49〜64 行目：`create_list(:interview_request, 3, ...)` を使うのは、このクエリ数テストだけ（指摘1）
- 計測（`tmp/bullet_probe.rb`）は `before(:each) { Bullet.start_request }` を入れた構成（＝案 B）で流している。案 A でも request spec の結果は同じはずです（Rack が `start_request` で計測を作り直すため）。ただ、案 A の構成で全件を流したわけではありません。やることの「rspec を流して確かめる」で補えます
- Notion の重複・依存は、ツールが無いため確かめていません

## 残すべき強み
- 案 B（rails_helper のフック）を「効いているように見えるだけ」として外した判断。sanity spec で factory のレコードが対象外になることを示し、gem のソースまで読んで根拠にしている
- 「Bullet で代われない（集計クエリ）」テストを残す方針と、その表
- `includes` を外して落ちることを確かめる手順。TSK-211 の偽陽性の教訓に沿っている
- `counter_cache_enable = false` / `unused_eager_loading_enable = false` で、対象を N+1 に絞っていること
- 未検証の前提を「未検証」に分け、確かめ方を書いていること

## 指摘（重要な順）

### 指摘1【重要】（観点：テスト計画／失敗の想定）
- 何が問題か：Bullet は「1 回のリクエストで 2 件以上読み込んだレコード」しか見ません。消す予定のクエリ数テストは、多くが N+1 を出すために、わざと複数件のデータを作る例です。テストごと消すと、そのエンドポイントで 2 件以上のデータを作る例が無くなります。そうなると Bullet は何も検知せず、しかも黙って通ります。草案の確かめ方（`includes` を外して落ちるか）は「消す前」に流すので、消した後に守りが残っているかは確かめられません。
- 根拠：`spec/requests/api/v1/teacher/interview_requests_spec.rb` 50 行目。`create_list(..., 3)` があるのはこの例だけで、他の例は `own_request` の 1 件が中心。他のテストも同じ作りだと推測します（各 spec の `create_list` / `times` を grep すれば確かめられる）
- 直し方の提案：テストを「消す」のではなく、「クエリ数の数え方（`subscribed` / `capture_queries` と件数の expect）だけを外し、複数件で取得する例として残す」にする。例は「3 件あっても 200 で全件を返す（N+1 は Bullet が見る）」です。完了条件の確かめ方も、「書き換えた後の spec で `includes` を外して落ちる」に変える。こうすれば、SQL 文字列への依存（オーナーの元の動機）は無くなり、データ件数の前提だけがテストに明示的に残ります。

### 指摘2【重要】（観点：事実か推測か）
- 何が問題か：`HighSchool => [:grades]` を「N+1 を直す」に入れていますが、`current_user.high_school.grades` は高校 1 件の関連で、件数によらず 1 クエリです。N+1 ではありません。Bullet が出したのは、HighSchool がどこかで複数件のクエリから読み込まれ、「possible object」に入ったためだと推測します（devise の `login_as` が test 側で作ったユーザーをそのまま使う、などが考えられる）。「`grades` を読み込む」で直そうにも、`includes` を付けるリレーションがありません。書けるのは `Grade.where(high_school_id: ...)` のような「Bullet を避ける書き換え」だけで、利用者には何の得もありません。
- 根拠：`app/controllers/api/v1/teacher/grades_controller.rb` 8〜10 行目、`tmp/bullet_probe_full.log` 132〜139 行目（`grades_spec.rb:34` から 1 件だけ）
- 直し方の提案：「全件で見つかる N+1」の表で、②を「本物の N+1 か要確認（誤検知の見込み）」に変える。やることに「HighSchool がなぜ possible object に入るかを確かめる」を足す。誤検知なら、`Bullet.add_safelist type: :n_plus_one_query, class_name: 'HighSchool', association: :grades` に理由のコメントを付ける方向にする。完了条件の「N+1 を直した、または理由つきで safelist」はそのままで合います。

### 指摘3【重要】（観点：事実か推測か／スコープ）
- 何が問題か：`Address => [:prefecture]` を「`AnnouncementsController#new`（43 行目付近）と `StudentsController#index`（`TeacherStudentsScope`）」の 2 か所で直すように書いていますが、どちらも `Teacher::StudentsQuery#students` の `includes(... :address ...)` を通ります。直すべき場所はここ 1 か所（`address: :prefecture`）です。43 行目付近に足すと、2 か所に重複して書くことになりかねません。また `StudentsQuery` は `Teacher::CreateInterviewRequestForm`（51 行目）も使っていて、都道府県の preload がそこにも付きます。影響は 1 クエリ増えるだけで軽微です。
- 根拠：`app/queries/teacher/students_query.rb` 9〜10 行目、`app/controllers/concerns/teacher_students_scope.rb`、`app/forms/teacher/create_interview_request_form.rb` 51 行目
- 直し方の提案：設計 3 を「`Teacher::StudentsQuery#students` の `includes` を `address: :prefecture` にする（生徒一覧・お知らせ作成の 2 か所に効く）」に書き換える。フォームに preload が増えることは許容すると 1 行書く。

### 指摘4【軽微】（観点：スコープと依存の切り方／規模）
- 何が問題か：「Bullet を有効にする＋違反を直す」と「既存のクエリ数テストを整理する（要確認のテストを 1 つずつ実験して消す）」は、別の関心事です。前者は Bullet を有効にした時点で必須（直さないと CI が落ちる）、後者は任意。後者の実験の結果しだいで PR が膨らみ、前者のマージも遅れます。
- 根拠：草案「やること」の後半 3 項目
- 直し方の提案：同じ PR でやるなら、コミットを分け、PR 本文の表で区別する。もしくは、テストの整理（指摘1の書き換え）を別チケットに切り出す。どちらにするかはオーナーに決めてもらえばよいです。

### 指摘5【軽微】（観点：失敗の想定）
- 何が問題か：`Bullet.enable = true` は safelist を空に戻します。safelist を別の initializer や `after_initialize` の前に書くと、黙って消えて CI が落ちます。誤検知を safelist に入れる予定（指摘2）なので、書く場所を決めておく必要があります。
- 根拠：`bullet-8.1.3/lib/bullet.rb` 66〜70 行目（`enable=` → `reset_safelist`）
- 直し方の提案：設計 1 のコードブロックに「safelist はこのブロック内、`Bullet.enable = true` の後に書く」と注記する。

### 指摘6【軽微】（観点：完了条件が測れるか）
- 何が問題か：完了条件の「関連の N+1 が入った request spec は CI で落ちる」は、条件付きの約束です（2 件以上のデータがある spec だけ）。将来の読み手が「N+1 は CI が全部見ている」と誤解する恐れがあります。Sidekiq ジョブ（`StudentCsvImportJob` など）・サービス・model の spec は見ていない、という範囲も明記されていません。加えて main にブランチ保護が無いので、「落ちる」はマージを止めません。
- 根拠：`app/jobs/` 配下、CI チケットの草案（「main にはブランチ保護が無い」）
- 直し方の提案：概要か完了条件に「対象は request spec で、2 件以上を読み込む例だけ。ジョブ・サービスの N+1 は対象外（集計と同じく明示的なテストで守る）」と書く。ブランチ保護についてはオーナーへの問いに回す。

### 指摘7【軽微】（観点：必須観点 1）
- 何が問題か：利用者のメリットが書かれていません。この変更で利用者が得をするのは、教師の 2 画面の N+1 が直ることだけです。
- 根拠：草案の概要と背景
- 直し方の提案：概要に「教師の生徒一覧とお知らせ作成画面で、生徒ごとに出ていた都道府県のクエリが 1 本になる」を 1 行足す。

## 本人に確認すべき問い
1. クエリ数テストは「消す」でよいか、それとも「数え方だけ外して複数件の例として残す」（指摘1）にするか。Go 移行のとき、どのエンドポイントが N+1 に弱いかの記録として残す価値をどう見るか
2. テストの整理を同じ PR でやるか、別チケットにするか（指摘4）
3. main にブランチ保護（Rails CI の必須化）を入れる予定はあるか。無い場合、「CI で落とす」の効き目は、レビュー時に赤を見る運用に頼ることになります
4. `HighSchool => [:grades]` が誤検知だった場合、safelist で済ませてよいか（コードは書き換えない）
