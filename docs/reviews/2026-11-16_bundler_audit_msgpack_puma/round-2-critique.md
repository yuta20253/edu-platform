# 批判：[Rails] bundler-auditで検知されたmsgpack/pumaの脆弱性を調査・対応する（第2周）

## 前回の指摘の扱いの確認

| 指摘 | 扱い |
|---|---|
| 1. CI構造的ギャップへの対応が比較・やることに無い | **一部直った**。「比較した案」に案D(schedule追加)を追加し比較した。本チケットに含めるかは「本人に確認すべき問い」に残し、「やること」にも一行の痕跡（オーナー判断待ち）を置いた。1周目の提案通りの対応で、理由にも納得できる |
| 2. GHSA-x646の除外理由がSSL未使用だけでは不十分 | **直っていない（別の誤りに置き換わった）**。`send_data`の3エンドポイントに根拠を差し替えたが、下記「確かめた事実」の通り、advisory本文が明示する脆弱経路は`send_file`（`to_path`に応答するファイルボディ）であり、`send_data`（Stringボディ）ではない。1周目の自分の提案文(「`send_file`等の実際の使用箇所」)が、2周目の調査で`send_file`ではなく似た名前の`send_data`に取り違えられている。結論（bundle updateする）自体は変わらないため実害は今のところ無いが、記録として残る調査結果が再び不正確 |
| 3. CHANGELOG確認の順序が最後 | **直った**。`bundle update`実行の直後、RSpec全件実行の前に移動されていることを「やること」で確認した |

## 総評
第1周の3指摘のうち2つはきちんと直っているが、核心だった「GHSA-x646の除外理由」はdocker上のadvisory DB原文を突き合わせると今も不正確で、`send_data`と`send_file`という紛らわしい別メソッドを取り違えている。幸い最終的なアクション（`bundle update puma msgpack`）はこの誤りの影響を受けず変わらないため、致命的ではないが、「調査結果として記録される理由」が誤っている状態での確定はこのチケットの性質（将来の棚卸しで読み返される`ignore`判断の先例になりうる文書）上好ましくない。

## 判定
直せば進めてよい ／ GHSA-x646の除外理由（send_data→send_file/to_path応答ボディの区別）を直せば進めてよい

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒・教師・管理者） | 単一インスタンス構成でDoS系脆弱性（残り5件のGHSA、特にワーカースレッド占有・ログflood・graceful shutdown無限待機）が全利用者に及ぶリスクを下げる（間接的） | 実質無し。`bundle update`のみで解消し、互換性リスクが低いことは実機検証済み |
| 開発チーム | CIの`Bundler Audit`が再びgreenに戻る。発火条件の調査プロセスが記録として残る | GHSA-x646の記録がまだ不正確なままだと、将来この記録だけを読んで`send_data`/`send_file`の区別を誤ったまま判断する人が出るリスクが残る |

- 両方にメリットがあるか：**利用者に損がない内部整理**（1周目と同じ）
- やらないことのデメリット：1周目から変化なし（更新しないと残り5件のDoS系GHSAが単一インスタンス構成の全利用者に影響したままになる）
- 草案に書かれていなかったメリット・デメリット：
  - GHSA-x646は実際には本アプリの現状の構成（TLS未使用・`send_file`未使用・ActiveStorageの配信ルート未マウント・`public/`配下は64KB未満の`robots.txt`のみ）では、おそらく発火条件自体を満たさない（草案に無い発見。下記「確かめた事実」参照）。ただし結論（update）には影響しない

## 確かめた事実

docker上の`edu-platform-rails-1`コンテナ内の`/root/.local/share/ruby-advisory-db/gems/puma/GHSA-x646-wp7c-h9mg.yml`でadvisory原文を直接確認した。

- advisory本文は明確に2つの経路のみを脆弱としている:
  1. **TLS**: `ssl_bind`/`ssl://`でPumaがTLS終端している場合（本アプリは未使用。1周目で確認済み）
  2. **64KB超のファイルボディ** (`IO.copy_stream`経由): 「*Rack::Files, Rails static file serving, and Rails send_file return these bodies*」と明記されており、**`send_file`**（および`Rack::Files`・静的ファイル配信）が名指しされている。`send_data`は一言も出てこない
- `actionpack-8.1.4.1/lib/action_controller/metal/data_streaming.rb`を読んで確認した。`send_data`は`render options.slice(:status, :content_type).merge(body: data)`で、`data`（本アプリでは`CSV.generate`が返す**String**）をそのままレスポンスボディにする。対して`send_file`は`response.send_file path`で、`to_path`に応答するファイル系オブジェクトを使う。両者はRails内部で明確に別の実装であり、`IO.copy_stream`の最適化（advisoryが問題にしている経路）が効くのは`send_file`側のみ
- 本リポジトリで`send_file`は`app/` `lib/` `config/`配下に0件（grep確認）。`config/routes.rb`に`ActiveStorage`のルートはマウントされていない（grep確認）。`config/application.rb:44`で`config.api_only = true`。`public/`配下は`robots.txt`（99バイト）のみで、64KB超の静的ファイルは存在しない
- つまりGHSA-x646は、TLS経路・ファイルボディ経路のどちらも、現状の構成では満たしていない可能性が高い（草案の「`send_data`のため除外できない」は技術的に誤り）
- 他の6件(puma GHSA 1件はx646以外に6件・msgpack CVE-2026-126366)についても、同じadvisory DBの原文を全件確認した。「残り5件は設定に関わらず一般的に当てはまる」という草案の分類は、原文(各ファイルに"default configuration is affected"等と明記)と一致しており、矛盾は見つからなかった。`GHSA-jm4r`(graceful shutdown)が要求する「single mode + 既定のforce_shutdown_after」も、`config/puma.rb`で`WEB_CONCURRENCY`既定値1→`workers`未呼び出し(single mode)、`force_shutdown_after`未設定(既定`:forever`)と一致することを確認した
- msgpackはCVE-2026-126366(JRuby限定、草案の記述通り)の他にCVE-2026-54522(`patched_versions: >= 1.8.2`)がadvisory DBに存在するが、`Gemfile.lock`の現行バージョン`1.8.3`で既にパッチ済みのため、これは検知対象に含まれていない。草案の「2件(msgpack 1件・puma 7件)」というカウントに漏れは無い

## 残すべき強み

- CHANGELOG確認を先頭寄りに移した順序修正は、過去の当たり指摘(TSK-244)のパターンを正しく再適用できている
- CI構造的ギャップを「やらない」と黙って流さず、案Dとして比較表に残し、オーナー確認の問いも維持した
- `send_data`の3箇所を実際にファイル名・行番号まで特定して確認しようとした調査態度自体は正しい方向で、取り違えた対象（メソッド名）だけが誤っていた

## 指摘（重要度順）

### 指摘1【重要】（観点：事実か推測か）
- 何が問題か：GHSA-x646-wp7c-h9mgのadvisory本文は脆弱な経路を`send_file`（および`Rack::Files`・Railsの静的ファイル配信、いずれも`to_path`に応答するファイルボディ）に限定しているが、草案は`send_data`（Stringボディ）の3エンドポイントを根拠に「除外できない」と結論している。`send_data`と`send_file`はRailsの別メソッドで、`Action Controller::DataStreaming`の実装上もレスポンスボディの種類が異なり、advisoryが問題にしている`IO.copy_stream`最適化は`send_file`側にしか効かない。
- 根拠：`rails/GHSA-x646-wp7c-h9mg.yml`（advisory原文、「Rack::Files, Rails static file serving, and Rails send_file return these bodies」）、`actionpack-8.1.4.1/lib/action_controller/metal/data_streaming.rb`（`send_data`は`render body: data`、`send_file`は`response.send_file path`）。加えて1周目の批判(指摘2)で自分が出した直し方の提案文自体が「`send_file`等の実際の使用箇所」と書いており、2周目の調査で似た名前の別メソッドに取り違えたことが対応表(`round-1-response.md`)から確認できる
- 直し方の提案：draftの該当箇所を次のように修正する。「GHSA-x646のファイル配信経路は`send_file`・`Rack::Files`・Rails静的ファイル配信（`to_path`に応答するボディ）に限られ、本アプリはこれらを使用していない(`send_file` 0件・ActiveStorageルート未マウント・`public/`は64KB未満の`robots.txt`のみ)。TLS経路も未使用のため、現状の構成ではGHSA-x646は発火条件を満たさない可能性が高い。ただし残り5件のGHSA(一般的なDoS)は発火条件を満たすため、`bundle update`で全件まとめて解消する方針に変更は無い」。結論(やること・完了条件)は変える必要はない

### 指摘2【軽微】（観点：失敗の想定／完了条件が測れるか）
- 何が問題か：指摘1を直す過程で、「GHSA-x646も含め全件が`bundle update`で解消される」ことの確認方法は既に完了条件にある(`bundler-audit check`の0件化)ため問題ないが、対応表(`round-1-response.md`)に「GHSA-x646は`send_data`の3エンドポイントにより発火条件を満たすと確定したため、追加確認は不要」と書かれている。この「確定」が実は誤りだったことから、同様の自己検証だけで「確定」と言い切る記述は今後も慎重さを欠くと誤りを残しやすい。
- 根拠：`round-1-response.md`の「指摘2は調査により解消」の記述
- 直し方の提案：今回の訂正を反映した上で、今後similarな自己検証ベースの結論には「bundler-auditの検知結果と組み合わせて確認」など、他の裏付け(ソースコードの原文一致など)も明記する運用を徹底する。今回のdraft訂正自体で十分だが、同じパターンの再発に注意する旨を一言残すとよい

## 本人に確認すべき問い
- （1周目から継続）指摘1(CI構造的ギャップ)について、本チケットの範囲でschedule追加等の軽微な対応を入れるか、別チケットとして切り出すか
- 今回の訂正(GHSA-x646の正しい除外理由)を反映した上で、3周目のレビューを回すか、軽微な文言修正のみとして直接確定するか
