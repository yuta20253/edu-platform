# 批判：タスク作成の優先度が「普通」に戻る不具合の修正（第2周）

## 前回の指摘の扱いの確認
- 指摘1（`reset` も必須で直す）：**直った**。`toPriorityValue` を1関数にし、`useDefaultValues` と `index.tsx` の `reset` の両方で使う形になった。コードを見ると `index.tsx` の `useEffect` と `useDefaultValues.ts` に同じ `typeof === "number"` 判定が実在し、草案の修正対象と一致している。
- 指摘2（既存テストの修正と画面の Red）：**一部直った**。直す対象のテストは正しく特定されている。ただし下の指摘1・2の問題が残る。
- 指摘3（実レスポンス確認）：**直った**。ネットワークタブで確認し、行わなければ「未検証」と明記する形になった。
- 指摘4（置き場所）：**直った**。`CreateTask/constants.ts` に `PRIORITY_BY_KEY` と変換関数を置き、`priorityMap` は触らない。
- 指摘5（完了条件）：**直った**。

## 総評
方向は正しく、致命的な欠陥は無い。残っているのは、Red の書き方（「Red はこのテスト」と言い切れていない点）と、画面テストの組み立て方が草案に書かれていない点。どちらも草案の数行で直せる。

## 判定
**直せば進めてよい**。設計は妥当で、利用者への悪影響もない。テスト計画の2点と依存の書き方を直せば、実装に入れる。

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒） | 「高い → 確認 → キャンセル」で優先度が保たれる。選び直しの手間と、気づかず「普通」で登録する事故が減る | 特になし。過去に「普通」で登録された分は直らないが、影響は軽微 |
| 開発チーム | 変換が1関数に集まり、API の型の食い違いに強くなる。数値も受けるので Go 移行向き | 変換関数と対応表が1つ増える。`reset` と `defaultValues` の二重経路は別チケットまで残る |

- 両方にメリットがあるか：**ある**。
- やらないことのデメリット：
  - 利用者が失うもの：戻るたびに優先度を選び直す手間。気づかないと意図しない優先度で登録される。
  - 開発チームが失うもの：`reset` を一本化する後続チケットで、同じバグが残ったまま移される。
- 草案に無いメリット・デメリット：草案に無い。EditTask と Confirm は影響を受けない（下の確かめた事実を参照）。

## 確かめた事実
- `useDefaultValues.ts` と `index.tsx` の `useEffect` の両方に、`typeof draftTask.priority === "number"` の判定がある。草案の記述どおり。
- `DraftTaskType.priority` は `string`。`CreateTaskForm.priority` は `number`（`types.ts`）。
- 他画面への影響は**無い**。
  - `PRIORITY` と `useDefaultValues` の利用は CreateTask 内に閉じている（grep で確認）。
  - `CreateTaskConfirm/hooks.ts` は `draftTask.priority`（文字列）をそのまま `/api/student/tasks` に送る。今回の変更の対象外で、これまでどおり動く。
  - EditTask は前回の確認どおり文字列 value で、影響は無い。
- `useDefaultValues.test.ts` は、`priority: "4"` を渡して `NORMAL` を期待するテスト（草案が「29行目」と書くテスト）が、バグを固定している。ただし草案の「29行」は `it` の開始行付近で、`"4"` の行そのものではない。指しているテストの特定には使えるが、行番号は変わりやすいので、テスト名で書くほうがよい。
- 同ファイルの3つ目のテスト（`priority: PRIORITY.HIGH`、数値）は**今も通る**。Red ではなく回帰防止。
- `CreateTask/index.test.tsx` の全ケースは `draftTaskId={0}` で、下書き取得（`useFetchDraftTask`）は一度も動いていない。`beforeEach` の `apiClient.get` は URL を問わず `{ data: mockCourses }` を返す。

## 残すべき強み
- 案 A（フロントで変換、API は触らない）と、案 B を退けた理由。
- 数値でも文字列でも壊れず、不明値は「普通」にする方針。
- `reset` を必須にし、変換を `toPriorityValue` の1関数にして二重管理を防いだこと。
- 未検証の前提を表にし、確かめ方を書いていること。

## 指摘（重要な順）

### 指摘1【重要】（観点：テスト計画）
- 何が問題か：画面テストの Red が、そのままでは書けない。`draftTaskId={0}` では下書き取得が動かない。また `apiClient.get` が URL を問わず `mockCourses` を返すので、`draftTaskId={100}` にしただけでは、下書きの取得結果が `mockCourses`（配列）になる。`draftTask.goal_id` などが undefined のまま `reset` され、「高い」が表示されるかどうかを判定する前に壊れる可能性が高い（推測。実際に書いて確かめる）。
- 根拠：`CreateTask/index.test.tsx` の `beforeEach`（`mockResolvedValue({ data: mockCourses })`）。`useFetchDraftTask.ts` は `/api/student/draft-tasks/${id}` を `apiClient.get` で取る。
- 直し方の提案：
  - 草案に「`apiClient.get` を URL で出し分ける。`/draft-tasks/` なら下書き、それ以外は `mockCourses`」と書く。
  - `mockResolvedValueOnce` は、TSK-212 の教訓どおり次のテストに漏れやすいので避ける。
  - 判定は、`await screen.findByRole("combobox", { name: "優先度" })` を取り、テキストに「高い」が出るまで待つ（`findBy` / `waitFor`）。取得が非同期なので、同期の `getBy` だと更新前に判定してしまい、Red / Green が偽陽性・偽陰性になる。
  - 「取得前は初期値の『普通』、取得後に『高い』」の流れなので、`reset` を直さず `useDefaultValues` だけ直した場合に Red のまま残ることまで確かめる。これが `reset` が必須であることの証明になる。

### 指摘2【重要】（観点：テスト計画）
- 何が問題か：草案の「Red」の定義が混ざっている。「既存テストを直す。これが Red」と「画面のテストを足す。現行は `NORMAL`」の2か所があるが、Red になるのは前者（`"high"` → `HIGH`）と画面テスト（`"high"` → 表示「高い」）だけ。「数値・不明値（`"4"` を含む）は回帰防止」と書かれたものは Red ではなく、現行でも通る。さらに、既存の「`"4"` → `NORMAL`」は直された後の姿が草案に書かれていない（`"high"` に書き換えると `"4"` の確認が消える）。
- 根拠：`useDefaultValues.test.ts` の3つのテスト。`"4"` を渡す1つ目は、書き換えるなら不明値のケースが別に必要になる。
- 直し方の提案：
  - やることを「Red（落ちることを確認する）」と「回帰防止（元から通る）」に分けて書く。
  - 既存の `"4"` のテストは削除せず、「不明値（`"4"`）は `NORMAL`」の独立したケースとして残す。`"high"` は新しいケースとして足す。
  - `toPriorityValue` の単体テスト（全5キー、数値、`"4"`、`null` / `undefined`）を `constants` 側に足す。5キーを網羅すると、`PRIORITY_BY_KEY` のキーの綴り間違い（`very_low` など）を拾える。Rails の enum（`draft_task.rb`）と一致するかが本命の確認になる。

### 指摘3【軽微】（観点：スコープと依存）
- 何が問題か：「依存」の記述が、後続チケットの状態を知っている前提で書かれている。前回の指摘1を受けて直した形だが、「このチケットが先なら…後続の一本化では変換関数を引き継ぐ」は、後続の草案（`student_create_task_draft_error`）が実際にこの関数を使う設計になっていることを確かめていない。
- 根拠：前回の批判で、後続の草案は `reset` を削除して `defaultValues` に一本化する計画。ただし最後のコミットで、まだ実施されていない（前回確認）。
- 直し方の提案：一方向に決める。「このチケットは後続の一本化とは独立にマージできる。後続のチケット側に『`useDefaultValues` が `toPriorityValue` を使っていること』を完了条件として足す」と書き、後続の草案にも1行入れる。順序で迷う余地を無くす。

### 指摘4【軽微】（観点：完了条件）
- 何が問題か：実画面確認が「行わなければ未検証と明記」で逃げられる。TSK-217 の教訓（実画面で前提が崩れた）から、画面遷移を伴う不具合は実画面での確認が本命。また、`typeof` 判定の `reset` と `Select` の value の型が揃わないと、MUI `Select` が out-of-range の警告を出す可能性がある（推測。コンソールを見る）。
- 直し方の提案：完了条件に「コンソールに MUI の value 警告が出ていない」を足す。実画面確認は「オーナー了承が取れなければ実装を止めるのではなく、PR 本文に『未検証』と明記する」まで書く。

## 本人に確認すべき問い
- 実画面確認のため開発サーバーを起動してよいか（前回と同じ。未回答なら実装時に確認でよい）。
- 後続の一本化チケットと、このチケットのどちらを先にマージするか。決まれば依存の書き方を一方向にできる。

関連ファイル：
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/index.tsx
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/hooks/useDefaultValues.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/hooks/useDefaultValues.test.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/index.test.tsx
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/constants.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTaskConfirm/hooks.ts