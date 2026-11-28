---
name: ticket
description: projects_kanri のチケット ID（TSK-xxx）を受け取り、kanri で着手を確定してから main から feature ブランチを作成し、TDD で実装し、セルフレビュー対応後にテンプレート通りの PR を作成する。着手時に In progress、PR 作成時に In review へ移行する。
argument-hint: <TSK-xxx>
disable-model-invocation: true
---

# /ticket — チケット駆動の開発フロー

引数: `$ARGUMENTS`（チケット ID。例 `TSK-123`）

以下の手順を **順番に** 実行する。各ステップの完了を簡潔に報告しながら進めること。
途中で前提が崩れた場合（ツールが無い、テストが通らない、要件が曖昧など）は推測で進めず、止まってユーザーに確認する。

チケットは Private の `projects_kanri` にあり、`kanri` コマンドで読み書きする。edu-platform は Public なので、**チケット本文・コメント・設計レビューの内容を PR・コミットメッセージ・コードコメントに転記しない**（チケット ID と、公開してよい概要だけを書く）。

## 0. 前提チェック

- `$ARGUMENTS` が `TSK-<数字>` の形でなければ停止して ID を求める。
- `kanri doctor` が成功すること。
  - `kanri` が見つからなければ、`projects_kanri` の README の「`kanri` コマンドを使えるようにする」を案内して停止。
  - 失敗した項目（clone が無い、Private でない、gh が未認証、未同期の変更がある など）があれば、その内容を伝えて停止。
- `git status --porcelain` が空であること。未コミットの変更があれば停止して確認。

## 1. チケット読み込み

- `kanri task show <ID> --json` で最新を取得する（内部で pull する）。
- 以下を抽出して、ユーザーに箇条書きで要約を提示する:
  - タイトル / ID / 現在の状態（`status`）/ 担当（`assignees`）
  - 背景・目的
  - やること・受け入れ条件
  - 対象（Next.js / Rails / 両方）
  - コメント（あれば要点）
- 次の場合は停止して確認する:
  - 依存が未完了（`dependencies.ready` が `false`）。Notion から移したチケットは依存を `depends_on` ではなく本文の `## 依存` に書いているので、本文の依存も確かめる（`kanri task show <依存先の ID>` で状態を見る）
  - 状態が `in_progress` 以降で、担当に自分以外がいる（他の人が着手済み）
  - 状態が `resolved` / `wont_fix`
- 要件に曖昧な点があれば、実装前にここで質問する。

## 2. 着手を確定する（In progress）

- `kanri task start <ID>` を実行する。自分を担当にして In progress にし、push まで行う。
- **失敗したら（他の人が先に着手した、依存が未完了、push できない など）、ブランチを作らずに停止する。** push の成功をもって着手確定とし、二重着手を防ぐため。
- 成功したら、その旨を報告する。

## 3. featureブランチ作成

- ブランチ名は **`feature/{ID}_{概要}`** とする。
  - `{ID}`: チケット ID をそのまま使う（大文字・ハイフンを保つ）。例: `TSK-139`
  - `{概要}`: チケットタイトルを英訳した **英小文字の snake_case（2〜4語程度）**。例: `admin_notice_editor`
  - 例: 「管理者お知らせ作成・編集画面」（TSK-139）→ `feature/TSK-139_admin_notice_editor`
- 同じ ID のブランチがローカル/リモートに無いことを確認（`git branch -a --list "*feature/<ID>_*"`）。既にあればユーザーに確認。
- 作成:
  ```bash
  git fetch origin main
  git switch -c feature/<ID>_<概要> origin/main
  ```

## 4. TDD で実装（細かくコミット）

要件をテストケース単位に分解し、TODOリストとして提示してから、1ケースずつ次のサイクルを回す。

1. **Red**: 失敗するテストを1つ追加 → テストを実行して **期待通り失敗することを確認** → コミット
   `test: 〇〇のテストを追加(red)`
2. **Green**: テストを通す最小限の実装 → テスト成功を確認 → コミット
   `feat: 〇〇を実装(green)`
3. **Refactor**（必要な場合のみ）: 振る舞いを変えずに整理 → テスト成功を確認 → コミット
   `refactor: 〇〇を整理`

### コミットメッセージのルール
- **本文は必ず日本語**。prefix（`test:` / `feat:` / `fix:` / `refactor:` / `types:` / `chore:`）のみ英語。
- 1コミット1関心事。無関係な変更を混ぜない。
- 型定義だけの追加などテストを伴わない準備は `types:` 等で単独コミットしてよい。

### 実行するテスト・チェック
- frontend（`frontend/` で実行）
  - テスト: `npm run test`（単体は `npx vitest run <path>`）
  - `npm run lint` / `npm run format:check` / `npm run typecheck`
  - テストファイルは実装ファイルと同階層に `*.test.tsx` / `*.test.ts` で置く（既存の慣習）
- rails（`rails/` で実行。docker 利用時は `docker compose exec rails ...`）
  - テスト: `bundle exec rspec`（単体は `bundle exec rspec <path>`）
  - `bundle exec rubocop`
- 既存の実装パターン（近いディレクトリの既存コード）を必ず確認して踏襲する。

全ケース完了後、上記のチェックを **すべて** 実行し、通ることを確認する。

## 5. セルフレビュー（1回）

- `git diff origin/main...HEAD` を読み、同ディレクトリの [review-checklist.md](review-checklist.md) の観点（**セキュリティ観点を含む**）でレビューする。
- 指摘を番号付きで一覧化してユーザーに提示する（各指摘: 該当箇所 `path:line`、問題、対応方針）。
- **1指摘につき1コミット** で対応する。各コミット前に関連テスト（必要ならテスト追加）を実行して通ることを確認。
  例: `fix: 他ユーザーのお知らせを取得できてしまう認可漏れを修正`
- セルフレビューは1回のみ。対応後に再レビューのループはしない。
- 指摘がゼロの場合はその旨を報告して次へ進む。
- 対応後に手順4のチェックを再度すべて実行する。

## 6. スクリーンショット（画面変更がある場合のみ）

- `git diff --name-only origin/main...HEAD` に `frontend/app/`・`frontend/features/`・`frontend/components/` 配下の UI 変更（`.tsx` やスタイル）が含まれるか判定する。含まれなければスキップ。
- 含まれる場合:
  1. アプリを起動する（Rails: `docker compose up -d`、Next.js: `frontend/` で `npm run dev` をバックグラウンド実行）。
  2. 変更の影響がある画面の URL を洗い出す。
  3. 撮影する:
     ```bash
     node .claude/skills/ticket/screenshot.mjs http://localhost:3000/<path> [...]
     ```
     - ログインが必要な画面は `SS_EMAIL` / `SS_PASSWORD` 環境変数を渡すと `/login` でログインしてから撮影する（ユーザーに認証情報の用意を依頼する。認証情報をコミットやPR本文に書かない）。
     - Playwright が無い場合は `npx playwright install chromium` 等を案内する。
  4. 保存先 `.claude/screenshots/<branch>/` のファイルパスを控える（gitignore 済み。コミットしない）。
  5. 起動したサーバーを停止する。

## 7. push & PR 作成

- `git push -u origin feature/<ID>_<概要>`
- `.github/pull_request_template.md` を読み、**その見出し構成のまま** 本文を作成して一時ファイルに書く:
  - `## 概要`: チケット ID（例 `TSK-139`）と、公開してよい範囲の背景・目的（チケット本文を貼らない）
  - `## 詳細`: 変更内容、レビュアーに重点的に見てほしい点・疑問に思いそうな点への補足（**セルフレビューで直した点は記載しない**）
  - `## 動作確認`: 実行したテスト・チェックとその結果。画面変更がある場合は画面ごとに見出しを付け、次のプレースホルダを置く:
    `<!-- ここに .claude/screenshots/<branch>/<file>.png をドラッグ&ドロップ -->`
  - `## その他`: ライブラリを導入した場合は比較候補と選定理由。無ければ「特になし」
  - `## 参考情報`: 参考にしたURLなど。無ければ「特になし」
  - テンプレートのHTMLコメント（`<!-- ... -->` の記入ガイド）は削除する
- タイトルは既存PRに合わせて `[Next.js] <チケットタイトル>` / `[Rails] <チケットタイトル>`（両方なら `[Next.js/Rails]`）。
- 作成（assignee は実行者自身）:
  ```bash
  gh pr create --base main --head feature/<ID>_<概要> \
    --title "<タイトル>" --body-file <一時ファイル> --assignee @me
  ```
- 作成後 `gh pr view --json assignees,url` で assignee が自分になっていることを確認する。

## 8. In review に移行

- PR 作成に成功したら、`kanri task review <ID> --pr <PR 番号>` で In review にし、PR 番号を記録する。
- 同期に失敗した場合（`push は未完了` と表示された場合）は、`kanri sync` を再実行して結果を報告する。

## 8.5. 設計レビューの答え合わせ（記録がある場合のみ）

- 設計レビューの記録は `projects_kanri/data/reviews/` にある。`kanri review show README.md` で最新の一覧と「答え合わせ」表を取得し、このチケット ID の行があるか確認する。無ければスキップする。
- ある場合は、実装・セルフレビュー・動作確認で分かった事実をもとに、「未確定」の行を「当たり／外れ／一部当たり」に更新し、根拠を書く。
  1. 取得した内容を `.claude/reviews-work/README.md` に書き出す（`.claude/reviews-work/` は gitignore 済み。コミットしない）。
  2. 該当の行だけを編集する。
  3. 保存の直前にもう一度 `kanri review show README.md` を取得し、手順 1 の内容から変わっていれば、その変更を取り込んでから保存する（他の人の更新を消さないため）。
  4. `kanri review save README.md --from .claude/reviews-work/README.md` で保存する（commit と push まで行う）。
  5. `.claude/reviews-work/README.md` を削除する。
- edu-platform の PR には含めない。

## 9. 完了報告

以下をまとめて報告する:
- PR の URL と assignee
- チケットの状態の遷移結果（In progress → In review）と、記録した PR 番号
- コミット一覧（`git log --oneline origin/main..HEAD`）
- セルフレビューの指摘と対応コミット
- スクリーンショットがある場合はファイルパスと、「PR の動作確認欄のプレースホルダ位置にドラッグ&ドロップで貼り付けてください」という案内
