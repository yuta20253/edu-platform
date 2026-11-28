# edu-platform 開発ルール

- **チケットと設計レビューの記録は Private の `projects_kanri` にある。** `kanri` コマンドで読み書きする。参照先は環境変数 `KANRI_HOME`、未設定なら隣の `../projects_kanri`。導入は `projects_kanri` の README を参照する
- **このリポジトリは Public。** チケット本文・コメント・設計レビューの内容を PR・コミット・コードに転記しない。PR にはチケット ID と公開してよい概要だけを書く
- **チケット作成と設計は `/draft-ticket` で行う。** 草案を批判役（`design-critic`）に最大 3 周レビューさせ、オーナーの確認を経てから `kanri` でチケットを作成・更新する。小さなチケットでも最低 1 周は通す。記録は `projects_kanri` の `data/reviews/` に残す
- **実装は `/ticket TSK-xxx` で行う。** `kanri task start` で着手を確定してから、TDD で実装し、PR を作る
- frontend の規約は `frontend/CLAUDE.md`、rails の規約は `rails/CLAUDE.md` を参照する
- PR 本文を更新するときは、GitHub 上の最新の本文を取得してから差分だけを当てる（手で貼ったスクリーンショットなどを消さないため）
