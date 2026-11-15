# 第1周 批判への対応

| 指摘 | 重大度 | 対応 | 理由・草案のどこを直したか |
|---|---|---|---|
| 1. CIの構造的ギャップ(pull_request+paths限定で定期検知が無い)への対応が比較・やることに無い | 重要 | 一部採用 | 「比較した案」に案D(scheduleトリガー追加)を追加して比較した。本チケットに含めるか別チケットに切り出すかはオーナーに確認する(手順5)。「やること」にも「(オーナー判断待ち)」として一行残した |
| 2. GHSA-x646の除外ロジックの一貫性(TLSだけでなくファイル配信経路もある) | 軽微 | 採用 | 自分でも`bundle exec bundler-audit check --update`でadvisory本文を確認し、さらに`send_data`を使うCSV配信エンドポイントが3箇所(`app/controllers/api/v1/admin/import_histories_controller.rb:35`、`app/controllers/api/v1/admin/csv_templates_controller.rb:10`、`app/controllers/api/v1/teacher/import_histories_controller.rb:39`)あることを確認した。GHSA-x646は「SSL未使用だから除外」ではなく「ファイル配信経路(send_data)が実際にあるため除外できない」という正しい理由に直した |
| 3. 「やること」の順序でCHANGELOG確認が最後になっている | 軽微 | 採用 | `bundle update`実行の直後、RSpec全件実行の前にpuma CHANGELOGを確認する順序に変更した |

## 本人に確認すべき問い（手順5で確認）
1. CIの構造的ギャップ(指摘1)について、本チケットの範囲で軽微な対応（schedule追加等）を入れるか、別チケットとして切り出すか
2. （指摘2は調査により解消。GHSA-x646は`send_data`の3エンドポイントにより発火条件を満たすと確定したため、追加確認は不要）
