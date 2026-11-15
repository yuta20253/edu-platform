# [Rails] bundler-auditで検知されたmsgpack/pumaの脆弱性を調査・対応する

## 概要

PR #247の`Bundler Audit`チェックで、`msgpack 1.8.3`(CVE-2026-126366, High)と`puma 8.0.2`(GHSA 7件)が新規に検知された。それぞれ実際にこのリポジトリで発火する条件を満たすか調査し、対応する。`bundle update`で解消できることを確認済みのため、本チケットでは調査結果に基づいてgemを更新する。

## 背景(調査結果)

- PR #247(TSK-246、`config/initializers/regexp_timeout.rb`の追加のみ)の`Bundler Audit`ジョブが2026-11-15時点で失敗した。PR #247自体はmsgpack/pumaのバージョンを変更していない(`git diff origin/main...HEAD`で`Gemfile`/`Gemfile.lock`に差分無し)ため、mainブランチの既存の依存バージョンで新規に検知されたもの
- `.github/workflows/rails-ci.yml`の`Bundler Audit`ジョブは`pull_request`トリガーのみで、`paths: rails/**`が変更されたPRでしか実行されない。main への push やスケジュール実行では走らないため、次に`rails/`配下を触るPRが開かれるまで気づかれない(今回はPR #247がその役割を果たした)。1〜3周のdesign-criticレビューではこれを「構造的ギャップ」として指摘され、scheduleトリガー追加(案D)を比較したが、**オーナー確認の結果、これは意図的な設計であり直す対象ではないと判明した**。本チケットのスコープは、既に検知された8件への対応のみとする
- 2周目のレビューで、`GHSA-x646`の除外理由について1周目で自分が書いた内容(`send_data`の3エンドポイントにより除外できない)が誤りだった(advisory原文が名指ししているのは`send_file`で、`send_data`とは別実装)という指摘を受け、advisory原文を直接確認した上で訂正した

### 検証済みの前提

- Ruby実行環境は`RUBY_ENGINE`で確認した結果`ruby`(CRuby/MRI)であり、JRubyではない
- `msgpack 1.8.3`の依存元は`bootsnap`のみ(`Gemfile.lock:91` `bootsnap (1.24.6) msgpack (~> 1.2)`)。`app/` `lib/` `config/`配下で`msgpack`を直接requireしている箇所は無い(grep 0件)ことを確認済み
- `bootsnap`は`config/boot.rb:4`で`require "bootsnap/setup"`されており、起動時のコンパイル結果などをローカルディスクにキャッシュする用途。外部から受け取ったmsgpackペイロードをデコードする経路は見当たらない
- CVE-2026-126366は「JRubyデコーダがヘッダー件数を無制限に確保し、5バイトのメッセージで数GiBのOOMを起こす」という内容で、JRuby実装限定の脆弱性。本リポジトリはCRubyのため、この脆弱性自体の発火条件(JRuby)を満たさない可能性が高い。ただし「msgpackのCRuby実装に同種の問題が将来報告される可能性」は別問題であり、ここでは今回報告されたCVE-2026-126366そのものが対象
- `puma`は`config/puma.rb`を確認した。`pumactl`のコマンド呼び出しはリポジトリ内に無い(grep 0件。`Procfile`等でも未使用)。`ssl_bind`等のSSL/TLS関連設定も無い
- puma GHSA 7件のうち、`pumactl`のTLS証明書検証不備(GHSA-86xc)と`ssl_cipher_filter`のデコード不備(GHSA-r885)は、上記の未使用設定により発火条件を満たさないと判断できる
- `GHSA-x646-wp7c-h9mg`(「Client that stops reading a TLS or file response holds a worker thread indefinitely」)のadvisory原文(`GHSA-x646-wp7c-h9mg.yml`)を直接確認した。脆弱な経路は(1)TLS終端時の書き込み、(2)64KB超のファイルボディ(`to_path`に応答するオブジェクトを`IO.copy_stream`で送る経路。「Rack::Files, Rails static file serving, and Rails send_file return these bodies」と明記)の2つのみで、**`send_file`**が名指しされている(`send_data`は対象外。Stringをそのままレスポンスボディにする別実装で、`IO.copy_stream`は使わない)。本リポジトリは`send_file`が0件(grep確認)、ActiveStorageのルートも未マウント(`config/routes.rb`にActiveStorage関連の記載無し)、`public/`配下は64KB未満の`robots.txt`のみで、TLS終端も行っていない。したがって`GHSA-x646`は現状の構成では発火条件を満たさない可能性が高い(2周目のdesign-criticレビューで、1周目に自分が`send_data`の3エンドポイントを根拠にしたのは`send_file`との取り違えだったという指摘を受け、advisory原文に基づいて訂正した)
- 残り4件(トリクル送信中のgraceful shutdownが無限待機、reactorのタイムアウト順序崩れ、FD枯渇時のacceptループがログをflood、100 Continue応答時にreactorがブロック)は、SSL設定の有無に関わらず一般的なHTTPサーバーの接続・スレッド処理に関する問題で、設定で回避できる根拠が無い。`GHSA-jm4r`(graceful shutdown無限待機)が要求する条件(single mode・`force_shutdown_after`未設定)も、`config/puma.rb`の既定値(`workers`未呼び出しでsingle mode、`force_shutdown_after`は既定の`:forever`)と一致することを確認した
- このうち`GHSA-rf6g`(FD枯渇時のacceptループ)・`GHSA-xw3h`(100 Continue)はadvisory原文が「前段にリバースプロキシ/ロードバランサがあれば緩和される」と明記している(3周目のdesign-criticレビューで指摘)。本番環境はまだ構築されておらず、プロキシ構成を前提にできる段階ではないため、現時点では緩和を前提にせず一般的に適用されるものとして扱う
- 単一インスタンス構成([[business_driver_performance_scale]])のため、これらのDoS系問題（スレッド占有・ログflood等）が起きた場合の影響は全利用者に及ぶ
- `bundle outdated puma msgpack`(実際の更新はせず読み取りのみ)で、`msgpack`は`1.8.3→1.8.7`、`puma`は`8.0.2→8.1.1`が利用可能であることを確認した。いずれも各advisoryの「Solution」が要求するバージョン(`msgpack >= 1.8.7`、`puma ~> 7.2.2 または >= 8.0.3`)を満たす
- `Gemfile`の`puma`の制約は`gem 'puma', '>= 5.0'`のみで、`msgpack`はGemfileに直接の記載が無く`bootsnap`経由の間接依存のため、Gemfileの変更は不要で`bundle update puma msgpack`だけで解消できる見込み
- 未検証: `bundle update`後に既存のRSpec・Rubocop・Brakemanが全て通ること(実装時に確認する)
- 未検証: puma 8.1.1への更新によるCHANGELOG上の破壊的変更の有無(パッチ/マイナーバージョンのため大きな変更は想定していないが、実装時に確認する)

## 設計

- `bundle update puma msgpack`を実行し、`Gemfile.lock`のみを更新する(`Gemfile`自体の制約変更は不要)
- 既存のRSpec・Rubocop・Brakemanを実行し、回帰が無いことを確認する
- `bundle exec bundler-audit check --update`を実行し、今回の2件(msgpack 1件・puma 7件のGHSA)が解消されることを確認する
- TSK-246(PR #247)とは別PRとする。TSK-246のスコープ外であり、無関係な変更を混ぜない

## 比較した案

- **案A: `bundle update puma msgpack`で両方とも最新パッチへ上げる(採用)**: 両gemともGemfileの制約変更無しに解消できることを確認済みで、追加調査の必要なく最もシンプルに解決できる
- **案B: 発火しないと判断してignore登録する(devise CVE2件の先例と同様)**: msgpackはJRuby限定、puma 3件(pumactl・SSL未使用の2件＋`GHSA-x646`)は未使用機能のため発火しないという主張はできるが、puma側の残り4件は設定に関わらず一般的に当てはまるDoS系で「発火しない」と言い切れない。かつ案Aが制約変更も互換性リスクも無く簡単に適用できるため、わざわざ発火条件を調査してignoreする理由が無い。不採用
- **案C: 何もせず次のRails関連のアップグレード作業時にまとめて対応する**: `Bundler Audit`ジョブが`pull_request`かつ`rails/**`差分トリガーのため、次に誰かがrails配下を触るPRを開くたびにこの失敗が再現し、無関係なPRの差分だと誤解されるリスクがある。案Aの対応コストが低いため、先送りする理由が無い。不採用
- **案D: `Bundler Audit`ジョブに`schedule`トリガー(週次cron等)を追加し、`rails/**`を誰も触らない期間でも新規の脆弱性に定期的に気づけるようにする**: TSK-244の教訓(ignoreの理由が3ヶ月半放置された)と根は同じに見えるが、オーナー確認の結果、「`pull_request`+`rails/**`差分限定」は意図的な設計であり、構造的ギャップではないと判明した。本チケットには含めない。不採用

## やること

- [ ]  `bundle update puma msgpack`を実行し、`Gemfile.lock`を更新する
- [ ]  puma 8.1.1のCHANGELOGを確認し、本リポジトリの`config/puma.rb`の設定(`threads` `workers` `preload_app!` `worker_timeout` `plugin :tmp_restart`)に影響する破壊的変更が無いか確認する(他のテスト・チェックより前に行う。破壊的変更が見つかった場合にRSpec等のコストを先行させないため)
- [ ]  `bundle exec bundler-audit check --update`で、今回検知された8件(msgpack CVE-2026-126366・puma GHSA7件)が解消されることを確認する(テスト観点: このコマンドの終了コードと出力を完了条件の根拠として残す)
- [ ]  既存のRSpecスイート全体を実行し、回帰が無いことを確認する
- [ ]  既存のRubocop・Brakemanを実行し、問題が無いことを確認する

## 完了条件

- `Gemfile.lock`の`puma`が`>= 8.0.3`、`msgpack`が`>= 1.8.7`になっている
- `bundle exec bundler-audit check --update`が、今回の8件を含め0件(既存のdevise ignore2件を除く)になる
- 既存のRSpec・Rubocop・Brakemanが全て通過する

## 依存

- なし。TSK-246(PR #247)とは独立
