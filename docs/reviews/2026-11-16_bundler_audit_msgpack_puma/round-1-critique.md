# 批判：[Rails] bundler-auditで検知されたmsgpack/pumaの脆弱性を調査・対応する（第1周）

## 総評
発火条件の調査が実際のadvisory DBの記述とほぼ完全に一致しており、推測で済ませず裏付けを取っている点は良い。案A（`bundle update`）の技術的な正しさも実機検証で確認できた。一方、草案自身が指摘している「CIの構造的ギャップ」への対応が比較・やることに反映されておらず、同じ組織が直前のTSK-244で経験した「放置が3ヶ月半続いた」教訓が再現しかねない抜けがある。

## 判定
直せば進めてよい ／ CI構造的ギャップへの対応方針を明記すれば進めてよい

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒・教師・管理者） | 単一インスタンス構成でDoS系脆弱性（スレッド占有・ログflood等）が全利用者に及ぶリスクを下げる（間接的） | 実質無し。Gemfile変更不要・互換性リスクが低いことを実地検証済み |
| 開発チーム | CIの`Bundler Audit`が再びgreenに戻り、以後のPRで「無関係な失敗」に惑わされなくなる。発火条件の調査プロセスが記録として残る | CHANGELOG確認等の小さな作業コスト。CI構造的ギャップ(後述)が残ると「次に誰かがrails/**を触るまで検知されない」状態が継続する |

- 両方にメリットがあるか：**利用者に損がない内部整理**（セキュリティパッチという性質上、間接的な利用者メリットはあるが、主眼は開発チームのCI健全性の回復）
- やらないことのデメリット：
  - 利用者が失うもの：単一インスタンス構成で、puma 7件のGHSA（特にワーカースレッド占有・ログflood系）が放置されたままになるリスクが全利用者に及ぶ
  - 開発チームが失うもの：TSK-244で経験した「`.bundler-audit.yml`のignoreが3ヶ月半放置」と同種のパターンが、今回は「更新そのものの先送り」という形で再現する。かつCIの`pull_request`+`rails/**`限定という構造自体は変わらないため、次に誰かがrails配下を触るPRを開くまで新規の脆弱性に気づけない状態が続く
- 草案に書かれていなかったメリット・デメリット：
  - 背景で指摘した「CIが`pull_request`かつ`rails/**`差分トリガーのため気づかれにくい」という構造的ギャップへの対応策が、「比較した案」「やること」のどちらにも反映されていない（指摘1）
  - GHSA-x646-wp7c-h9mgの発火条件除外ロジックの一貫性の弱さ（指摘2）

## 確かめた事実

草案の記述の正確性を、docker上のRailsコンテナで`bundler-audit`の実データ・`bundle update`の実行結果を使って検証した。**食い違いは無かった。**

- `rails/Gemfile.lock`の`msgpack (1.8.3)`・`puma (8.0.2)`・`bootsnap (1.24.6) msgpack (~> 1.2)`・`gem 'puma', '>= 5.0'`（msgpack直接記載なし）は記載通り
- `rails/config/boot.rb`の`require "bootsnap/setup"`、`rails/config/puma.rb`に`pumactl`呼び出し・`ssl_bind`等のSSL設定が無いことも確認した
- `.github/workflows/rails-ci.yml`の`bundler-audit`ジョブは`pull_request` + `paths: rails/**, .github/workflows/rails-ci.yml`のみ。スケジュール実行は無い。`dependabot.yml`等も存在しない
- `bundle exec bundler-audit check --update`を実機で実行し、advisoryの実テキストを取得した。msgpackのCVE-2026-126366は「JRuby decoder makes uncapped header-count allocations」で草案の記述と完全一致。pumaの7件のGHSA ID・タイトルも、草案の要約（pumactlのTLS検証不備=GHSA-86xc-wrr9-xmmq、ssl_cipher_filter=GHSA-r885-m39c-939g、トリクル送信中のgraceful shutdown=GHSA-jm4r-w4xx-qxw7、reactorタイムアウト順序=GHSA-m5xw-3hrw-qcmf、FD枯渇時のacceptループ=GHSA-rf6g-xhmp-gm7v、ワーカースレッド占有=GHSA-x646-wp7c-h9mg、100 Continue=GHSA-xw3h-pgr9-3vg7）とすべて一致した
- `/tmp`（コンテナ内）にGemfile/Gemfile.lockをコピーして`bundle update puma msgpack`を実際に実行した結果、`Gemfile.lock`の差分はmsgpack(1.8.3→1.8.7)・puma(8.0.2→8.1.1)の2行のみで、他gemへの連鎖的な変更は発生しなかった。更新後に`bundle exec bundler-audit check --config rails/.bundler-audit.yml`を実行すると`No vulnerabilities found`。草案の「Gemfileの制約変更無しに解消できる」という主張は実証された
- `gh pr view 247`で、PR #247は`rails/config/initializers/regexp_timeout.rb`と対応するspecの2ファイルのみを変更しており、`Gemfile`/`Gemfile.lock`に差分が無いことを確認した。`gh pr checks 247`でも`Bundler Audit`のみ失敗、他3ジョブはpassしていることを確認した
- `git log --follow -- rails/.bundler-audit.yml`で、直前のTSK-244・devise CVE調査(2026-11-15)の経緯を確認した。「ignoreの理由が3ヶ月半実態とずれたまま放置された」という過去の教訓(`docs/reviews/2026-11-14_rails_8_upgrade/round-1-critique.md`)は、今回のCI構造的ギャップの指摘と根が同じ（定期的な棚卸しの仕組みが無い）
- `rails/Dockerfile`はdev用（`CMD ["bash"]`、vim同梱）で本番用ではない。本番のCloudflare構築計画はまだ無いため、native extension(msgpack)のビルド環境差分リスクは現時点では評価対象外と判断してよい

## 残すべき強み

- 発火条件の調査を「推測」で終わらせず、実際のadvisory DBの記述・リポジトリのgrep結果で裏付けている。JRuby限定／pumactl・SSL未使用という除外理由は、ほぼそのままadvisoryの本文と一致していた
- 「案B(ignore)」を検討した上で、2件は発火しないと言えるが残り5件は言い切れないという理由で不採用にしたこと。安易に全件ignoreに流れていない
- 単一インスタンス構成というビジネス文脈([[business_driver_performance_scale]])を踏まえて、DoS系の影響範囲(全利用者)を評価に組み込んでいる
- TSK-246(PR #247)とスコープを明確に分離し、無関係な変更を混ぜていない

## 指摘（重要度順）

### 指摘1【重要】（観点：やらないことのデメリット／スコープと依存の切り方）
- 何が問題か：背景で「`Bundler Audit`ジョブが`pull_request`かつ`rails/**`差分トリガーのため、次に`rails/`配下を触るPRが開かれるまで気づかれない」という構造的ギャップを自ら指摘しているのに、「比較した案」にはこのギャップ自体への対応策(定期実行の追加など)が選択肢として入っておらず、「やること」にも反映されていない。つまり診断は正しいが、処方が無い。
- 根拠：`.github/workflows/rails-ci.yml`を確認し、`on: pull_request` + `paths`のみで`schedule`トリガーが無いことを確認した。加えて、直前のTSK-244のレビュー(`docs/reviews/2026-11-14_rails_8_upgrade/round-1-critique.md`)で「`.bundler-audit.yml`のignoreが3ヶ月半放置された」ことが「重要」指摘として扱われており、根本原因（定期的な棚卸しの仕組みが無い）は今回と同じである。同じ根本原因を見つけながら対応を決めずに進めると、次の脆弱性でも同じ驚きが再現する。
- 直し方の提案：「比較した案」に案D（例：`bundler-audit`ジョブに`schedule: cron`を追加して週次実行する。あるいはmainへのpushでも実行する）を追加して比較する。採用しない場合も、「本チケットのスコープ外とし、別チケットとして切り出す／切り出さない」をオーナーに確認し、どちらかを明記する。少なくとも「本人に確認すべき問い」に残すだけでは次に繋がらないので、設計の「やること」か「依存」のどこかに一行でも痕跡を残すべき。

### 指摘2【軽微】（観点：事実か推測か／対策の重複）
- 何が問題か：puma GHSA-x646-wp7c-h9mgの実際のタイトルは「Client that stops reading a **TLS or file** response holds a worker thread indefinitely」で、TLS経路とファイル配信経路の両方が発火条件になっている。草案はGHSA-86xc・GHSA-r885の2件だけを「SSL/TLS未使用」で除外し、GHSA-x646は「残り5件は設定に関わらず一般的に当てはまる」に分類しているが、GHSA-x646のTLS側の条件には同じ除外ロジック(SSL未使用)が実は当てはまる。結論（結局updateする）は変わらないため実害は無いが、将来この調査結果だけを見て「ignoreで済ませられないか」を再検討する人がいた場合、除外ロジックの線引きが一貫していないまま読むと誤判断の元になる。
- 根拠：docker内で`bundle exec bundler-audit check --update`を実行し、advisory本文のタイトルを直接確認した（上記「確かめた事実」参照）。
- 直し方の提案：「残り5件」の記述に、GHSA-x646はTLS経路とファイル配信経路の2つがあり、ファイル配信経路（本アプリでのActive Storage配信や`send_file`等の実際の使用箇所）がある限り除外できないことを一言補う。該当するcontrollerを1つ挙げられると根拠が強くなる。

### 指摘3【軽微】（観点：失敗の想定／スコープと依存の切り方、TSK-244の教訓の再適用）
- 何が問題か：「やること」の順序が、`bundle update`→`bundler-audit check`→RSpec全件→Rubocop/Brakeman→puma 8.1.1のCHANGELOG確認、の順になっている。CHANGELOGの確認(puma.rbの設定に影響する破壊的変更の有無)が最後に置かれているため、仮に破壊的変更が見つかった場合、その前に実行したRSpec全件・Rubocop・Brakemanのコストが先行してしまう。
- 根拠：TSK-244のround-2批判（`docs/reviews/2026-11-14_rails_8_upgrade/round-2-critique.md`）で、同種の「後工程で分かることを先にやってしまう順序」が指摘され「当たり」として記録されている。同じパターンが今回も残っている（推測ではなく、過去の当たり指摘のパターンの再適用）。
- 直し方の提案：`bundle update`実行の直後（RSpec全件実行の前）にCHANGELOGを確認する順序に変更する。パッチバージョンなので大きな変更は想定しにくいという判断自体は妥当だが、確認コストはCHANGELOGを読むだけで数分程度のはずなので、先に倒しても損がない。

## 本人に確認すべき問い
- 指摘1のCI構造的ギャップについて、本チケットの範囲で軽微な対応（schedule追加等）を入れるか、別チケットとして切り出すか、どちらを選ぶか。切り出す場合は起票するかどうかも含めて判断してほしい
- GHSA-x646（指摘2）のファイル配信経路について、本アプリの実際の使用箇所（Active Storageの配信コントローラ等）を具体的に特定する調査を追加するか、それとも「一般的に当てはまる」という現状の粒度のままで良いか
