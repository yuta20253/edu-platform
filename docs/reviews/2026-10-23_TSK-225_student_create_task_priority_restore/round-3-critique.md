# 批判：タスク作成の優先度が「普通」に戻る不具合の修正（第3周）

## 前回の指摘の扱いの確認
- 指摘1（画面テストの組み立て）：直った。URL で出し分ける `apiClient.get`、`mockReset`、`findBy` / `waitFor`、「`reset` を直さないと落ちたまま」が草案に入った。コードと照らして、組み立ては合っている。
- 指摘2（Red と回帰防止の分離）：直った。回帰防止、Red、Green の3節に分かれた。既存の `"4"` ケースは削除せず、不明値のケースとして残す。`toPriorityValue` の単体テストも足された。
- 指摘3（依存の一方向化）：草案は直ったが、後続の草案が直っていない。草案に「後続チケット側に完了条件として足す」と書いたものの、`student_create_task_draft_error/draft.md` に `toPriorityValue` は 0 件（grep で確認）。詳しくは下の指摘1。
- 指摘4（MUI 警告と実画面確認）：直った。MUI の value 警告が無いことが完了条件に入り、了承が無くても実装は止めず「未検証」と明記する形になった。

## 総評
設計と、テスト計画の組み立ては固まった。残る欠陥は、後続の草案に書き足す1行の未反映と、`toPriorityValue` の数値の範囲検査の1点だけで、どちらも数行で直せる。

## 判定
**直せば進めてよい**。後続の草案へ1行を入れ、数値の範囲検査を決めれば、実装に入れる。もう1周は不要。

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒） | 「高い → 確認 → キャンセル」で優先度が保たれる。選び直しの手間と、気づかず「普通」で登録する事故が減る | 特になし。過去に「普通」で登録された分は直らないが、データ上は正しい値なので問題にならない |
| 開発チーム | 変換が `toPriorityValue` の1関数に集まる。数値も受けるので Go 移行で API が数値になっても壊れない。Rails の enum との綴りの一致を単体テストで固定できる | 変換関数と対応表が1つ増える。`reset` と `defaultValues` の二重経路は後続チケットまで残る |

- 両方にメリットがあるか：**ある**。
- やらないことのデメリット：
  - 利用者が失うもの：戻るたびに優先度を選び直す手間。気づかないと意図しない優先度で登録される。
  - 開発チームが失うもの：後続の `reset` 一本化で、バグが残ったまま移される。
- 草案に無いメリット・デメリット：
  - `toPriorityValue` が数値を無条件で通すと、範囲外の値（例：99）でも MUI の value 警告が出る。草案に無い（指摘2）。

## 確かめた事実
- `useDefaultValues.ts` と `index.tsx` の `useEffect` の両方に `typeof draftTask.priority === "number"` の判定がある。草案のとおり。
- `useForm({ defaultValues })` の初期値は、最初のレンダーでしか使われない。最初のレンダーでは `draftTask` が `null` なので、`useDefaultValues` だけを直しても画面は直らない。`reset` 必須という草案の主張は正しい。
- `useFetchDraftTask` の URL は `/api/student/draft-tasks/${id}`。草案の URL 分岐（`draft-tasks` を含むか）で出し分けられる。`draftTaskId={0}` では取得が動かないため、有効な数値にする記述も正しい。
- `index.test.tsx` の現状は、`beforeEach` が `vi.clearAllMocks()` に `mockResolvedValue` の組み合わせ。草案の「`mockReset` に変える」は、`beforeEach` の書き換えを意味する。既存ケースへの影響は小さい（推測）。
- `useDefaultValues.test.ts` の1つ目に `priority: "4"` → `NORMAL` のテストがあり、バグを固定している。数値 `PRIORITY.HIGH` のテストは現行でも通る。草案の分類（回帰防止と Red）と一致している。
- `draft_task.rb` に `enum priority`、シリアライザは `priority` を素通し。DB のカラムは integer。Rails の enum は文字列で返る可能性が高いが、実レスポンスは未確認。草案が未検証の前提として表に書いている。
- 後続の草案（`student_create_task_draft_error/draft.md`）に `toPriorityValue` は無い。ただし 113 行目に「`priority` の実際の型を確かめる。優先度の不具合の別チケットが起票されている」とあり、この件を別チケットとして扱う前提にはなっている。

## 残すべき強み
- 案 A（フロントで変換、API は触らない）を採用し、案 B（Rails を数値にする）を退けた理由。
- 数値でも文字列でも壊れず、不明値は「普通」にする方針。
- `reset` を必須にして変換を1関数にまとめたこと。
- 回帰防止、Red、Green を分け、`useDefaultValues` → `reset` と段階ごとに確かめる順序。
- 未検証の前提を表にして、確かめ方を書いていること。

## 指摘

### 指摘1【重要】（観点：スコープと依存）
- 何が問題か：草案は「後続チケット側に、`useDefaultValues` が `toPriorityValue` を使っていることを完了条件として足す」と書いている。しかし後続の草案にはその1行が無い。後続は「`reset` を削除して `defaultValues` に一本化する」計画なので、このチケットが先にマージされた場合、後続の作業中に `toPriorityValue` の呼び出しが落ちても気づける仕組みが無い。
- 根拠：後続の草案 `student_create_task_draft_error/draft.md`（54 行目、103 行目、111 行目）に `toPriorityValue` の記述が無い。grep の結果も 0 件（確認済み）。
- 直し方の提案：
  - 後続の草案 111 行目の完了条件の隣に、「`useDefaultValues` が `toPriorityValue`（priority_restore チケットの成果）を使っている」を1行足す。
  - 後続に回帰防止のテストがあるなら、そのテストに `priority: "high"` → `HIGH` のケースを足してもよい。このチケットの `useDefaultValues.test.ts` のケースがそのまま残るので、重複する場合は入れなくてよい。

### 指摘2【軽微】（観点：失敗の想定、完了条件）
- 何が問題か：`toPriorityValue` が「数値はそのまま採用」としか書かれていない。範囲外の値（0、99、`NaN`）をそのまま採用すると、完了条件の「不明な値は『普通』」と食い違う。MUI の `Select` も out-of-range の警告を出す。
- 根拠：草案の「数値が来た場合は、そのまま採用」と「不明な値は『普通』」が両立していない（推測：実装で確かめる）。
- 直し方の提案：「数値は `1〜5` の範囲だけ採用し、それ以外は『普通』」と書く。`toPriorityValue` の単体テストに `0` と `6` を足す。

### 指摘3【軽微】（観点：テスト計画）
- 何が問題か：画面テストの Red の流れに、「取得前は普通」と書いてある。ただ、`findBy` で「高い」を待つだけでは、取得前の「普通」を確かめたことにならない。順序を確かめる記述が草案に無い。
- 根拠：草案のテスト計画の記述。Select の表示文字列を確かめる方法は、`getByRole("combobox", { name: "優先度" })` のテキストを見ることになる（推測）。
- 直し方の提案：「取得前は普通」を判定に入れるなら、取得を保留する Promise（resolve を手動で呼ぶ）を `mockImplementation` に仕込み、保留中に「普通」を確かめてから resolve する、と書く。入れないなら「取得前は普通」の記述を削り、「取得後に『高い』」だけにする。後者が簡単で、Red の判定にも十分。

## 本人に確認すべき問い
- 実画面確認のために開発サーバーを起動してよいか（未回答。実装時に確認で足りる）。
- このチケットと後続の一本化チケットのどちらを先にマージするか。草案は「独立してマージできる」と書いているので、どちらが先でも進められる。今のままで構わない。

関連ファイル：
- /Users/ryonakadoi/Documents/app/edu-platform/docs/reviews/2026-10-23_student_create_task_priority_restore/draft.md
- /Users/ryonakadoi/Documents/app/edu-platform/docs/reviews/2026-10-23_student_create_task_draft_error/draft.md
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/index.tsx
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/hooks/useDefaultValues.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/hooks/useDefaultValues.test.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/index.test.tsx
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/constants.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTaskConfirm/useFetchDraftTask.ts