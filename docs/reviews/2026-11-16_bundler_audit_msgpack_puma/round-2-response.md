# 第2周 批判への対応

| 指摘 | 重大度 | 対応 | 理由・草案のどこを直したか |
|---|---|---|---|
| 1. GHSA-x646の除外理由が`send_data`は誤りで、実際は`send_file`/`Rack::Files`/静的ファイル配信(`to_path`応答ボディ)が対象 | 重要 | 採用 | 自分でもadvisory原文(`GHSA-x646-wp7c-h9mg.yml`)を確認し、「Rack::Files, Rails static file serving, and Rails send_file return these bodies」と明記されていること、`send_file`が本リポジトリに0件・ActiveStorageルート未マウント・`public/`は64KB未満の`robots.txt`のみであることを確認した。GHSA-x646は現状の構成では発火条件を満たさない可能性が高いという正しい結論に直した。`bundle update`する結論自体は変わらない |
| 2. 自己検証だけで「確定」と言い切った記述が、実際には誤りだった | 軽微 | 採用 | 今回の訂正をdraftに反映した。advisory原文(ソースの一次情報)を直接確認した上での結論であることを明記した |

## 本人に確認すべき問い（1周目から継続、手順5で確認）
1. CI構造的ギャップ(scheduleトリガー追加)について、本チケットの範囲で対応を入れるか、別チケットとして切り出すか
