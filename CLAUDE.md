# edu-platform 開発ルール

- **チケット作成と設計は `/draft-ticket` で行う。** 草案を批判役（`design-critic`）に最大 3 周レビューさせ、オーナーの確認を経てから Notion に作成・更新する。小さなチケットでも最低 1 周は通す。記録は `docs/reviews/` に残す
- **実装は `/ticket` で行う。** Notion のチケットから TDD で実装し、PR を作る
- frontend の規約は `frontend/CLAUDE.md` を参照する
- PR 本文を更新するときは、GitHub 上の最新の本文を取得してから差分だけを当てる（手で貼ったスクリーンショットなどを消さないため）
