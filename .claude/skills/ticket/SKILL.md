---
name: ticket
description: NotionのチケットURLを受け取り、mainからfeatureブランチを作成してTDDで実装し、セルフレビュー対応後にテンプレート通りのPRを作成する。着手時にNotionカンバンをIn progress、PR作成時にIn reviewへ移行する。
argument-hint: <notion-ticket-url>
disable-model-invocation: true
---

# /ticket — Notionチケット駆動の開発フロー

引数: `$ARGUMENTS`（NotionチケットのURL）

以下の手順を **順番に** 実行する。各ステップの完了を簡潔に報告しながら進めること。
途中で前提が崩れた場合（ツールが無い、テストが通らない、要件が曖昧など）は推測で進めず、止まってユーザーに確認する。

## 0. 前提チェック

- `$ARGUMENTS` が空、または Notion の URL でなければ停止して URL を求める。
- `gh auth status` が成功すること。失敗したら `gh auth login` を案内して停止。
- Notion MCP のツール（`notion-fetch` / `notion-update-page` など。サーバー名によって `mcp__notion__notion-fetch` 等の名前になる）が使えること。サーバー定義はリポジトリ直下の `.mcp.json` に含まれているため追加は不要。ツールが使えない場合は未認証なので、`/mcp` から `notion` を選んで Notion アカウントで認証するよう案内して停止。
- `git status --porcelain` が空であること。未コミットの変更があれば停止して確認。

## 1. チケット読み込み

- Notion MCP の fetch ツールで `$ARGUMENTS` のページを取得する。
- 以下を抽出して、ユーザーに箇条書きで要約を提示する:
  - タイトル / **ID プロパティ**（`unique_id` 型。`プレフィックス-番号` 形式で、例 `TSK-139`）/ 現在の Status
  - 背景・目的
  - やること・受け入れ条件
  - 対象（Next.js / Rails / 両方）
- 親データベース（カンバン）のスキーマから **ステータス用プロパティ**（`status` 型、無ければ `select` 型で名前が Status/ステータス のもの）と、その選択肢に `In progress` / `In review` があるかを確認しておく（大文字小文字・空白の差は無視して一致させる）。見つからなければここで停止して確認。
- ID プロパティが見つからない、または値が空の場合は、ブランチ名を推測せず停止してユーザーに確認する。
- 要件に曖昧な点があれば、実装前にここで質問する。

## 2. featureブランチ作成

- ブランチ名は **`feature/{ID}_{概要}`** とする。
  - `{ID}`: 手順1で取得した Notion の ID プロパティの値をそのまま使う（大文字・ハイフンを保つ）。例: `TSK-139`
  - `{概要}`: チケットタイトルを英訳した **英小文字の snake_case（2〜4語程度）**。例: `admin_notice_editor`
  - 例: 「管理者お知らせ作成・編集画面」（TSK-139）→ `feature/TSK-139_admin_notice_editor`
- 同じ ID のブランチがローカル/リモートに無いことを確認（`git branch -a --list "*feature/<ID>_*"`）。既にあればユーザーに確認。
- 作成:
  ```bash
  git fetch origin main
  git switch -c feature/<ID>_<概要> origin/main
  ```

## 3. Notion を In progress に移行

- ブランチ作成直後に、Notion MCP の update-page ツールで手順1で特定したステータスプロパティを `In progress` に更新する。
- 更新後に再取得して反映を確認し、報告する。

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
  - `## 概要`: NotionチケットのURL、背景・目的
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

## 8. Notion を In review に移行

- PR 作成に成功したら、ステータスプロパティを `In review` に更新する。
- 可能であれば Notion ページに PR の URL をコメントとして残す（`notion-create-comment` 等）。
- 再取得して反映を確認する。

## 9. 完了報告

以下をまとめて報告する:
- PR の URL と assignee
- Notion のステータス遷移結果（In progress → In review）
- コミット一覧（`git log --oneline origin/main..HEAD`）
- セルフレビューの指摘と対応コミット
- スクリーンショットがある場合はファイルパスと、「PR の動作確認欄のプレースホルダ位置にドラッグ&ドロップで貼り付けてください」という案内
