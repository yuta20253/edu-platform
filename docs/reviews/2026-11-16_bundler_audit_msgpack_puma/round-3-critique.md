# 批判：[Rails] bundler-auditで検知されたmsgpack/pumaの脆弱性を調査・対応する（第3周・最終）

## 前回の指摘の扱いの確認

| 指摘 | 扱い |
|---|---|
| 1. GHSA-x646の除外理由が`send_data`は誤りで、実際は`send_file`/`Rack::Files`/静的ファイル配信(`to_path`応答ボディ)が対象 | **直った（検証済み）**。advisory原文をdocker上で再取得し、`draft.md`の引用「Rack::Files, Rails static file serving, and Rails send_file return these bodies」が一字一句原文と一致していることを確認した。`send_file` 0件・ActiveStorageルート未マウント(grep該当0件)・`public/robots.txt`が99バイトであることも、すべて自分の環境で再現確認できた |
| 2. 自己検証だけで「確定」と言い切った記述の慎重さ | **直った**。`draft.md`は「可能性が高い」と言い切らないヘッジ表現に統一され、advisory原文という一次情報を根拠として明記している |

## 総評
第2周で指摘した`send_data`/`send_file`の取り違えは、advisory原文・Railsソース・自分のgrep結果のすべてで裏付けが取れ、正確に訂正されていた。件数の整合性（puma除外3件: GHSA-x646・86xc・r885／適用4件: jm4r・m5xw・rf6g・xw3h、合計7件＋msgpack 1件＝8件）も、残っている7件のadvisory原文をすべて自分で再取得して突き合わせ、矛盾は見つからなかった。CI構造的ギャップ（scheduleトリガー追加）も、比較・やること・本人への問いの3箇所に一貫して「オーナー判断待ち」の痕跡が残っており、放置ではない。致命的な欠陥は見当たらない。

## 判定
直せば進めてよい ／ 1点だけ軽微な追記で完成度が上がるが、ブロッカーではない。追記なしでもこのまま進めてよいレベル

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒・教師・管理者） | 単一インスタンス構成でDoS系脆弱性（残り4件の一般的なGHSA、特にワーカースレッド占有・ログflood・graceful shutdown無限待機）が全利用者に及ぶリスクを下げる（間接的） | 実質無し。`bundle update`のみで解消し、互換性リスク(実機で`bundle update`済み、Gemfile.lock差分2行のみ)は1周目で検証済み |
| 開発チーム | CIの`Bundler Audit`が再びgreenに戻る。発火条件の調査プロセスが、2周の訂正を経て高い精度の記録として残る(将来のignore判断の先例として信頼できる) | 無し。記録の正確性は本周の確認で裏付けられた |

- 両方にメリットがあるか：**利用者に損がない内部整理**（1・2周目と変化なし。セキュリティパッチという性質上、間接的な利用者メリットは一貫してある）
- やらないことのデメリット：1・2周目から変化なし（更新しないと一般的なDoS系4件が単一インスタンス構成の全利用者に影響したままになる）
- 草案に書かれていなかったメリット・デメリット：下記「指摘1」参照（結論には影響しない軽微な記述の精度の話）

## 確かめた事実
（すべて自分の環境・docker上の`edu-platform-rails-1`コンテナで再現確認した。草案の記述との食い違いは無かった）

- `GHSA-x646-wp7c-h9mg.yml`原文を再取得し、`draft.md`の引用が完全一致することを確認した。`patched_versions`は`~> 7.2.2` / `>= 8.0.3`で、草案の記述と一致
- `rails/`配下で`send_file`は0件（`grep -rn "send_file" app lib config`）。`send_data`は草案記載の3箇所（`admin/import_histories_controller.rb` `admin/csv_templates_controller.rb` `teacher/import_histories_controller.rb`）のみで一致。`config/routes.rb`にActiveStorage関連の記載なし。`public/`は`robots.txt`(99バイト)のみ
- `Gemfile.lock`の`msgpack (1.8.3)` `puma (8.0.2)` `bootsnap (1.24.6) msgpack (~> 1.2)`、`Gemfile`の`gem 'puma', '>= 5.0'`（msgpack直接記載なし）を確認。`config/puma.rb`に`ssl_bind`等のTLS設定なし、`workers`は`WEB_CONCURRENCY > 1`の場合のみ呼ばれ既定はsingle mode、`force_shutdown_after`の設定なし(既定`:forever`)を確認。`config/application.rb:44`で`config.api_only = true`
- 残り6件のpuma advisory原文(`GHSA-86xc` `GHSA-r885` `GHSA-jm4r` `GHSA-m5xw` `GHSA-rf6g` `GHSA-xw3h`)を全て自分で再取得した。件数(除外3件・適用4件・合計7件)、`GHSA-jm4r`が要求する「single mode + `force_shutdown_after`未設定」との一致、いずれも草案の記述と矛盾なし
- `msgpack`の advisory DB は`CVE-2026-126366`(JRuby限定)と`CVE-2026-54522`(`patched_versions: >= 1.8.2`)の2件が存在し、後者は現行`1.8.3`で既にパッチ済みのため検知対象外。草案が言及する「msgpack 1件」というカウントと矛盾しない
- `rails/.bundler-audit.yml`を確認し、既存ignoreが草案記載通り`CVE-2026-32700` `CVE-2026-40295`(devise、計2件)のみであることを確認した。完了条件の「8件を含め0件(devise ignore2件を除く)」の数字と一致

## 残すべき強み
- 2周を経て、記録として残る調査結果の正確性が大きく上がった。advisory原文を自分で取得して引用と事実を突き合わせる調査姿勢は、本チケットの性質（将来のignore判断の先例になる文書）に見合っている
- CI構造的ギャップをスコープに含めず放置もせず、比較案・やること・本人確認の3箇所に一貫して痕跡を残した設計は、TSK-244の教訓（放置の再発）を踏まえた対応として適切
- 件数（除外3件・適用4件・合計7件＋msgpack1件＝8件）が、本周の再検証を含めすべての箇所で一貫している

## 指摘（重要度順）

### 指摘1【軽微】（観点：事実か推測か）
- 何が問題か：草案は残り4件(`GHSA-jm4r` `GHSA-m5xw` `GHSA-rf6g` `GHSA-xw3h`)を「設定で回避できる根拠が無い」と一括りにしているが、このうち`GHSA-rf6g`(「Deployments behind a reverse proxy or load balancer that limits connections to Puma are not affected」)と`GHSA-xw3h`(「A reverse proxy in front of Puma that buffers responses prevents the attack」)は、advisory原文がリバースプロキシによる緩和を明記している。`GHSA-x646`で一度「TLS/ファイル配信経路の両方を確認する必要がある」という教訓を得た直後なので、同じ丁寧さをこの2件にも適用するなら「本番にリバースプロキシが前段にあるか」も確認対象になるはずだが、その言及が無い
- 根拠：`GHSA-rf6g-xhmp-gm7v.yml``GHSA-xw3h-pgr9-3vg7.yml`の原文（本レビューで再取得）。ただし本番環境は現時点で未構築（Notion「本番環境Cloudflare構築計画」はまだ計画段階、`tmp/ticket_21_production_nginx_tls.md`も「❌未着手」のさくら+nginx案で、Cloudflare計画と矛盾する古い草稿の可能性があり、どちらも確定情報ではない）ため、「プロキシがあるから安全」と言い切れる段階ではない
- 直し方の提案：結論（`bundle update`する）は変える必要が無いので、ブロッカーにはしない。一言「`GHSA-rf6g`・`GHSA-xw3h`はリバースプロキシでの緩和が原文に記載されているが、本番のプロキシ構成は未確定のため、現時点では緩和を前提にせず一般的に適用されるものとして扱う」と補足すると、x646の訂正と同じ丁寧さが保たれ、将来の読み手が「なぜこの2件だけ確認していないのか」と疑問を持たずに済む

## 本人に確認すべき問い
- （1・2周目から継続）CI構造的ギャップ(`Bundler Audit`へのscheduleトリガー追加)を、本チケットの範囲で軽微な対応として入れるか、別チケットとして切り出すか。3周のレビューを終えるこのタイミングで決めてほしい
- 指摘1(リバースプロキシ緩和の言及)を追記するか、結論に影響しないため追記せず確定するか

## 総括（オーナー向け）
第2周で見つかった`send_data`/`send_file`の取り違えは、本レビューで advisory 原文・Railsソース・リポジトリの grep 結果をすべて自分で再現し、訂正が正確であることを確認しました。件数の整合性（puma除外3件・適用4件・合計7件＋msgpack1件＝8件）、既存の devise ignore 2件との整合も、全てのadvisoryファイルを再取得して矛盾が無いことを確認済みです。

残る指摘は1件のみで、重大度は軽微（結論を変えない、記述の丁寧さの話）です。CI構造的ギャップは1〜3周を通じて一貫して「オーナー判断待ち」として記録されており、放置ではなく意図的な先送りです。

このチケットは、追記なしでも進めて問題ないレベルに達しています。4周目のレビューは不要と判断します。残っているのは「CI scheduleトリガーをこのチケットに含めるか」「指摘1の一文を追記するか」という、オーナーにしか決められない2点のみです。

（参考・本チケット外）`tmp/ticket_21_production_nginx_tls.md`、`tmp/production_decisions_tracker.md`で、本番インフラ計画が「さくらサーバー+nginx」案と「Cloudflare」案で食い違っている可能性があり、将来Cloudflare構築計画を詰める際に確認した方がよいが、本bundler-auditチケットの結論には影響しない。
