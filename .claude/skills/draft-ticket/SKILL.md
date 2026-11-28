---
name: draft-ticket
description: チケットや設計の草案を作り、批判役（design-critic）に最大3周レビューさせてから、オーナーの確認を経て projects_kanri にチケットを作成（または既存チケットを更新）する。批判の記録は projects_kanri の data/reviews/ に残し、edu-platform には PR を作らない。
argument-hint: <やりたいことの説明 | 見直したいチケットの ID（TSK-xxx）>
disable-model-invocation: true
---

# /draft-ticket — 批判役のレビューを通してからチケットを作る

引数: `$ARGUMENTS`（やりたいことの説明、または設計を見直したいチケットの ID。例 `TSK-217`）

以下の手順を **順番に** 実行する。各ステップの完了を簡潔に報告しながら進めること。
途中で前提が崩れた場合（ツールが無い、要件が曖昧など）は推測で進めず、止まってオーナーに確認する。

チケットと設計レビューの記録は Private の `projects_kanri` にあり、`kanri` コマンドで読み書きする。edu-platform は Public なので、**草案・批判・対応表を edu-platform にコミットしない**。作業中のファイルは gitignore 済みの `.claude/reviews-work/` に置く。

## 0. 前提チェック

- `$ARGUMENTS` が空なら停止して内容を求める。
- `kanri doctor` が成功すること。`kanri` が見つからなければ、`projects_kanri` の README の「`kanri` コマンドを使えるようにする」を案内して停止。失敗した項目があれば、その内容を伝えて停止。

## 1. 要件の把握

- 引数がチケット ID なら、`kanri task show <ID> --json` でそのチケットを取得し、依存・関連チケットも `kanri task show` で取得する。
- 関連する設計ドキュメントは `kanri doc search <語>` で探し、`kanri doc show <パス>` で読む。
- 目的・対象（Next.js / Rails / 両方）・完了条件が曖昧なら、草案を書く前に質問する。

## 2. 調査と前提の検証

- 関係するコードを読み、既存の実装・規約（`frontend/CLAUDE.md`）・共通部品を確認する。
- **設計の前提になる事実は、コードか実画面で確かめる。** 確かめられないものは「未検証」と明記し、確かめる方法を草案に書く。
  - 例（TSK-217）：「ID が変わる遷移でコンポーネントの state が残るか」は、実画面で `router.push` とブラウザの戻るを試して確かめる。単体テストでは分からない。
- 実画面での確認に、開発 DB への一時データ作成やサーバー起動が必要な場合は、オーナーの了承を得てから行い、終わったら片付ける。

## 3. 草案を書く

- 作業フォルダ `.claude/reviews-work/<YYYY-MM-DD>_<slug>/` を作り、`draft.md` に草案を書く（`<slug>` は英小文字の snake_case）。既存チケットの見直しなら `<slug>` の先頭にチケット ID を付ける（例: `TSK-217_notice_editor`）。
- 草案はチケットの本文と同じ構成にする:
  - `## 概要` / `## 背景(調査結果)` / `### 検証済みの前提`（何を・どう確かめたか）/ `## 設計` / `## 比較した案`（採用しない理由つき）/ `## やること`（テスト観点を含む）/ `## 完了条件` / `## 依存`

## 4. 批判のループ（最大 3 周）

各周で次を行う。

1. Agent ツールで `design-critic` を呼ぶ（`subagent_type: "design-critic"`）。プロンプトには次を渡す:
   - 第何周か
   - 作業フォルダのパスと、読むべきファイル（`draft.md`、2 周目以降は前回の `round-N-critique.md` と `round-N-response.md`）
   - 草案が参照しているコード・チケット ID・ドキュメントのパス
2. 返ってきた批判を **そのまま** `round-N-critique.md` に保存する（要約しない）。
3. 指摘ごとに対応を決め、`round-N-response.md` に表で書く:
   - `| 指摘 | 重大度 | 対応（採用／一部採用／不採用） | 理由・草案のどこを直したか |`
   - 「本人に確認すべき問い」は、自分で決めずに一覧にしておき、手順 5 でオーナーに聞く。
4. 採用した指摘を `draft.md` に反映する。

**終了条件**:

- 判定が「このまま進めてよい」になったら終了する。
- 3 周しても「このまま進めてよい」にならなければ、残っている指摘と自分の考えを並べて手順 5 でオーナーに判断を仰ぐ（4 周目は回さない）。
- 判定が「考え直すべき」のときは、草案を直して次の周に進む前に、方向を変えてよいかオーナーに確認する。

## 5. オーナーの確認

次をまとめて提示し、AskUserQuestion で確認する（チケット作成の承認を兼ねる）:

- 各周の判定の推移（例: 直せば進めてよい → 直せば進めてよい → このまま進めてよい）
- 批判を受けて変えた主な点、不採用にした指摘とその理由
- 未解決の指摘と「本人に確認すべき問い」
- 最終的な草案の要点

オーナーの回答で草案を直した場合は、`draft.md` に反映する（批判をもう 1 周回すかはオーナーに聞く）。

## 6. チケットに反映

- 新規なら `kanri task create --title "<[Next.js] / [Rails] などの接頭辞> <題名>" --body-file .claude/reviews-work/<フォルダ>/draft.md` で作成し、出力された ID（例: `TSK-221`）を控える。優先度・種類・依存が決まっていれば `--priority` / `--type` / `--depends-on` も付ける。
  - 作成はオンライン必須。失敗したら原因を伝えて停止する。
- 既存チケットの見直しなら `kanri task update <ID> --body-file .claude/reviews-work/<フォルダ>/draft.md` で本文を置き換える。
- 作成・更新後に `kanri task show <ID>` で内容を確認する。

## 7. 記録を残す（projects_kanri の data/reviews/）

1. 新規チケットなら、作業フォルダ名の先頭の日付のあとにチケット ID を入れる（例: `2026-10-21_TSK-221_xxx`）。
2. `kanri review save <フォルダ名> --from .claude/reviews-work/<フォルダ名>` で記録を保存する（commit と push まで行う）。
3. チケットの本文の末尾に、`## 設計レビュー記録` として `[data/reviews/<フォルダ名>/](../reviews/<フォルダ名>/draft.md)` を追記し、`kanri task update <ID> --body-file <追記した draft.md>` で反映する。
4. 一覧と答え合わせ表を更新する。
   1. `kanri review show README.md` の内容を `.claude/reviews-work/README.md` に書き出す。
   2. 「レビューの一覧」に 1 行追加する（チケット・日付・周回数・最終判定・記録へのリンク `<フォルダ名>/draft.md`）。批判の各指摘を「答え合わせ」表に「未確定」として追加する。
   3. 保存の直前にもう一度 `kanri review show README.md` を取得し、手順 1 の内容から変わっていれば、その変更を取り込んでから保存する（他の人の更新を消さないため）。
   4. `kanri review save README.md --from .claude/reviews-work/README.md` で保存する。
5. 保存できたら `.claude/reviews-work/` の作業フォルダと README.md を削除する。
- edu-platform にはブランチも PR も作らない。

## 8. 完了報告

- チケットの ID と題名
- 各周の判定の推移と、批判を受けて変えた主な点
- 未解決の指摘（あれば）
- 記録の保存先（`data/reviews/<フォルダ名>/`）

## 答え合わせ（実装後）

`/ticket` で実装したとき、実装やレビューで分かった事実をもとに、`projects_kanri` の `data/reviews/README.md` の「答え合わせ」表を更新する（当たり／外れ／一部当たり）。批判役はこの表を見て、当たりやすい指摘と外れやすい指摘の傾向を次の批判に活かす。
