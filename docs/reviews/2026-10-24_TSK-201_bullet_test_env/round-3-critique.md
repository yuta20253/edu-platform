# 批判：テスト環境で Bullet を有効にし、N+1 を CI で検知する（第3周）

## 前回の指摘の扱いの確認

| 指摘 | 確認 |
|---|---|
| 1. 総クエリ数を比べる型（学級申請一覧）を書き換えると守りが消える | 直った。設計 4 で書き換えの基準を「テストの型」に変え、表の `school_class_requests_spec.rb` も「代われない（関連以外の N+1 も見ている）」になった |
| 2. 書き換えた後のテストから「2 件以上」の意図が読めない | 直った。やることに it 名の揃え方とコメントの文面が入った |
| 3. HighSchool の safelist はアプリ全体に効く | 直った。設計 3 とやることに「原因を特定 → 直す → 駄目なときだけ safelist、コメントに外すきっかけ」の順が入った |
| 4. 「ジョブは明示的なテストで守る」は事実と違う | 直った。概要の書き方を直し、比較表に案 F を足した |
| 5. 依存がファイル名になっている／着手とマージの区別が無い | 一部直った。着手とマージは書き分けられた。ただ ID は `<CI チケットID>` のプレースホルダのまま。CI チケット（`docs/reviews/2026-10-24_rails_ci_ubuntu_runner/`、未追跡）を Notion に作ってから埋める、という段取りで納得 |

## 総評
第 2 周の 5 指摘は、どれも筋よく反映されています。反映で新しい問題は生まれていません。残っているのは「書き換えた後の確かめ方」の粒度です。入れ子の関連を見ている `import_histories` の 2 件は、`includes` を丸ごと外すだけでは一部の関連しか確かめられません。

## 判定
直せば進めてよい
（重要 1 件は、やることに数行足せば直ります。土台（案 A・違反の対応・型で分ける書き換え・書き換え後の検証）は固まっています）

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒・教師・管理者） | 教師の生徒一覧とお知らせ作成画面で、都道府県のクエリが 1 本にまとまる。今後、関連の N+1 が入っても PR の段階で赤く出る（間接的） | 見た目・挙動の変化は無い。面談申請フォームで preload が 1 本増える（草案で許容済み、影響は小さい） |
| 開発チーム | SQL 文字列（バッククォート）に頼る検査が減る。新しい一覧系エンドポイントも、2 件以上のデータを作れば追加の手間なく守られる | 書き換えの検証の手間。safelist の管理。Go 移行で Bullet は無くなる（ただ、移行までの守りとしては十分に見合う） |

- 両方にメリットがあるか：ある（利用者へのメリットは小さいが、損は無い）
- やらないことのデメリット：
  - 利用者が失うもの：教師の 2 画面で都道府県の N+1 が残る（per_page 件まで）
  - 開発チームが失うもの：関連の N+1 を守れるのは、クエリ数テストがある約 6 か所だけのまま。新しいエンドポイントには守りが無い
- 草案に無いメリット・デメリット：
  - 草案に無い：テストスイートの実行時間が少し延びる見込み。Bullet はリクエスト中のレコード読み込みと関連の呼び出しをすべてフックするため（推測）。計測で全件（2352 件）を流しているので、Bullet あり・なしの所要時間を PR に 1 行書けば済む

## 確かめた事実
- `config/environments/test.rb` 32 行目は `show_exceptions = :rescuable`。草案の記述どおり
- `Teacher::StudentsQuery` 10 行目の `includes` は `:address`（`:prefecture` は無い）。`Teacher::CreateInterviewRequestForm` 51 行目と `TeacherStudentsScope` から使われている。草案どおり
- `Teacher::GradesController#index` は `current_user.high_school.grades` だけ。草案どおり
- `student/dashboards_spec.rb` 65 行目、`student/teacher interview_requests_spec.rb` 62 行目、`student/teacher interview_request_messages_spec.rb` 53 行目は、どれも `FROM \`...\`` の grep 型。データはそれぞれ goal 2 件 × task 2 件、メッセージ 5 件で、2 件以上の条件を満たす
- `teacher/import_histories_spec.rb` の 172 行目（show）と 220 行目付近（export）は、**`users`・`grades`・`school_classes`（と `import_errors`）を同時に**数えている。コントローラ側は `includes(:import_errors, imported_students: { user: %i[grade school_class] })`（`import_histories_controller.rb` 27・35 行目）で、関連が入れ子になっている
- 同じ spec の 66 行目「一覧では imported_students / import_errors を読み込まない」も grep 型だが、見ているのは「読み込まないこと」で N+1 ではない。草案の表（「import_histories_spec.rb（2 件）」）には載っていない
- test 環境の ActiveJob のアダプタは Rails の既定（`:test`）で、リクエストの中でジョブは実行されない。計測の結果とずれる要素は無い
- Notion の重複・依存は、ツールが無いため確かめていません

## 残すべき強み
- 「書き換えた後に `includes` を外して落ちることを確かめたものだけ書き換え、落ちなければ残す」という手順と、それを完了条件にも入れたこと
- 「テストの型」（grep 型／総クエリ数の比較型／集計型）で扱いを分ける基準。理由（SQL 文字列への依存、関連以外の N+1）が設計 4 に一緒に書かれている
- 検証済み／未検証の切り分け。特に `raise` がテストまで届くかを未検証に置き、作業の最初に確かめる手順にしたこと
- 案 B・B'・F を根拠つきで不採用にした比較表
- 検知の範囲（request spec・2 件以上・関連のみ・ジョブは守られていない）を概要と完了条件の両方に正直に書いたこと

## 指摘（重要な順）

### 指摘1【重要】（観点：テスト計画／失敗の想定）
- 何が問題か：`import_histories_spec.rb` の 2 件は、1 つのテストで入れ子の関連を 3 つ（`imported_students.user`・`user.grade`・`user.school_class`）守っています。やることの「`includes` を一時的に外して Bullet が落とすことを 1 つずつ確かめる」が「spec ごとに 1 回」と読めるため、`includes` を丸ごと外して落ちたのを見ただけで書き換えると、`grade` / `school_class` の守りが確かめられないまま消えるおそれがあります。丸ごと外すと users は 1 件ずつ読み込まれます。Bullet は 1 件だけ読み込んだレコードを対象にしないので、その先の `grade` / `school_class` の N+1 は記録されず、`ImportedStudent => [:user]` だけで落ちる見込みです（推測。根拠は草案の検証済みの前提「2 件以上読み込んだレコードしか対象にしない」と同じ仕組み）。テストは赤くなるので「確かめた」ように見えますが、本当に守れているのは 3 つのうち 1 つだけになります
- 根拠：`spec/requests/api/v1/teacher/import_histories_spec.rb` 172〜181 行目・export の「生徒数が多い場合」、`app/controllers/api/v1/teacher/import_histories_controller.rb` 27・35 行目
- 直し方の提案：やることの検証の文を「**テストが守っている関連ごとに**、その関連だけを `includes` から外して Bullet が落ちることを確かめる（例：`user: %i[grade school_class]` から `grade` だけ外す）。1 つでも落ちなければ、そのテストはクエリ数テストのまま残す」に変える。表の `import_histories_spec.rb` の行に、守っている関連（`imported_students.user`・`user.grade`・`user.school_class`）を書く。`import_errors` の `eq(1)` は 1 件の履歴の has_many なので N+1 ではなく、外しても損は無い、と PR の表に書けば十分です

### 指摘2【軽微】（観点：事実か推測か）
- 何が問題か：`import_histories_spec.rb` 66 行目「一覧では imported_students / import_errors を読み込まない」は grep 型なので、設計 4 の基準だけを読むと書き換えの対象に入ります。しかし、見ているのは「余計に読み込まないこと」です。Bullet では代われません（`unused_eager_loading_enable = false` で、そもそも「読み込まない」は N+1 ではない）。検証の手順（`includes` を外して落ちるか）でも落ちないので、結果として残るはずですが、表に載っていないため、作業者が判断に迷うおそれがあります
- 根拠：同 spec 66〜72 行目。草案の表は「import_histories_spec.rb（2 件）」とだけ書いている
- 直し方の提案：表に 1 行足す。「`teacher/import_histories_spec.rb`『一覧では imported_students / import_errors を読み込まない』｜読み込まないこと（N+1 ではない）｜代われない」。あわせて設計 4 の基準を「grep 型で、**関連の N+1 を見ているもの**」と一言補う

### 指摘3【軽微】（観点：テスト計画）
- 何が問題か：「数え方だけ外して『複数件あっても全件を返す』例として残す」とありますが、外した後に何を `expect` するかが書かれていません。数え方を消すだけだと期待値の無い例（`subject` を呼ぶだけ）が残り、rubocop-rspec の `RSpec/NoExpectationExample` に引っかかるか、件数を確かめない弱い例になります（推測。rubocop-rspec の設定は未確認）
- 根拠：草案の設計 4・やることの書き換えの項目
- 直し方の提案：規約に「作った件数がレスポンスに全部含まれることを `expect` する（例：`ids` が `contain_exactly(*messages.map(&:id))`、CSV なら全員の名前を含む）」を 1 行足す。it 名の「全件を返す」とも一致します

## 本人に確認すべき問い
1. （第 2 周の対応表の問い 1〜4 は、そのままオーナーに聞いてください。どれも妥当です）
2. 依存の `<CI チケットID>` は、CI チケットを Notion に作ってから埋める段取りでよいか（このチケットを先に Notion に作る場合は、空欄のまま作って後で埋めるのか）
3. テスト時間が延びる量を PR に書くか（CI が必須チェックでない今は、目安が分かれば十分と見ます）
