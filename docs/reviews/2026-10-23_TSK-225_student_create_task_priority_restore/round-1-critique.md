# 批判：タスク作成の優先度が「普通」に戻る不具合の修正（第1周）

## 総評
原因の見立て（文字列を数値としか見ない判定）は正しい。ただし、**草案の修正箇所では画面が直らない可能性が高い**。実際にフォームへ値を入れているのは `index.tsx` の `reset` で、そこが「条件つき」扱いになっている。Red の書き方にも問題がある。

## 判定
**直せば進めてよい**。`reset` 側の修正を「条件つき」から「必須」に変え、Red の対象も直せばよい。

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒） | 優先度を「高い」にして確認画面から戻っても、選んだ値が残る。入力し直す手間と、気づかずに「普通」で登録する事故が減る | 特になし。ただし、すでに「普通」で登録された過去分は直らない（影響は軽微） |
| 開発チーム | 下書きの値をフォームに戻す経路が正しくなり、API の型（文字列／数値）の食い違いに強くなる（Go 移行向き） | 変換関数が増える。`reset` と `useDefaultValues` の両方に入れると二重管理になる（指摘1、4） |

- 両方にメリットがあるか：**ある**。生徒の不具合が直り、開発側は型の食い違いの根を断てる。
- やらないことのデメリット：
  - 利用者が失うもの：戻るたびに優先度を選び直す手間。気づかないと意図しない優先度で登録される。
  - 開発チームが失うもの：`reset` を `defaultValues` に一本化する別チケット（TSK-223 の後続）で、同じバグが残ったまま移されるリスク。
- 草案に無いデメリット：既存テストが今のバグを正解として固定している（指摘2）。

## 確かめた事実
- `DraftTaskSerializer` は `priority` をそのまま出す。モデルは `enum priority`（DB は integer）。ActiveModelSerializers は `object.priority` を読むので、**文字列（`"high"`）で返る見込みはコードからはほぼ確実**。実レスポンスの確認は未了で、草案もそう書いている。
- `DraftTaskType.priority: string`（`useFetchDraftTask.ts:24`）、`priorityMap` は文字列キー。草案の記述は事実と合っている。
- `CreateTask/constants.ts` の `PRIORITY` は 1〜5 の数値。`priorities` の value も数値で、`Select` の `onChange` は `Number(...)`。送信は数値で、`create_draft_task_form` は integer。
- `index.tsx` の `reset` の `useEffect` は、`useDefaultValues` と同じ `typeof === "number"` 判定を**もう一度**持っている。`draftTask` は非同期取得なので、`useForm` の初期 `defaultValues` は取得前の空値になる。**実際に下書きの値をフォームへ入れるのは `reset` の側**。
- `useDefaultValues.test.ts:29` は `priority: "4"` を渡して `NORMAL` を期待している。現行テストが今のバグの挙動を固定している。
- EditTask は `priorities` の value が文字列（`"high"`）で、`defaultValue={String(task.priority)}` で使っている。API の文字列と一致するので**同種の問題は無い**。`PRIORITY` 定数は EditTask にもあるが、優先度の選択には使われていない。
- 別の草案 `student_create_task_draft_error` では、`reset` を削除して `defaultValues` に一本化する計画。ただし最後の別コミットで、まだ実施されていない。

## 残すべき強み
- 案 A（フロントで変換、API は触らない）の採用と、案 B を退けた理由。
- 「数値でも文字列でも壊れない、不明値は普通」という方針。Go 移行にも効く。
- 型を未検証の前提として表にし、確かめ方を書いている。

## 指摘

### 指摘1【致命的】（観点：事実か推測か／対策の重複）
- 何が問題か：`useDefaultValues` だけ直しても画面は直らない。現状の経路では `reset` が `defaultValues` を上書きするので、`reset` 側が `typeof` 判定のままなら「普通」に戻る。草案は「先にこのチケットを進めるなら `reset` 側も」と条件つきにしているが、**現状では `reset` の方が効いている側**。さらに「どちらが先でもよい」という依存の書き方も正しくない。`reset` の一本化が先に入る場合、その実装を `useDefaultValues` の修正と同時に確認しないと、直ったかどうか分からない。
- 根拠：`CreateTask/index.tsx` の `useEffect`（`typeof draftTask.priority === "number"`）。`draftTask` は `useFetchDraftTask` で後から入る。
- 直し方の提案：
  - 変換を 1 つの関数にする（例：`toPriorityValue(raw: unknown): number`）。`useDefaultValues` と `reset` の両方がその関数を呼ぶ。`reset` 側を「条件つき」ではなく**やることに入れる**。
  - 依存は「先後どちらでもよい」ではなく、「`reset` の一本化が先に入っていたら、その時点の経路で再確認する」と書く。

### 指摘2【重要】（観点：テスト計画）
- 何が問題か：Red が草案のとおりに書けない。`useDefaultValues.test.ts:29` の `priority: "4"` → `NORMAL` は、今のバグを正解として固定している。そのまま残すと、Green にしたときにこのテストが落ちる（または不明値扱いのまま残って意味がなくなる）。
- 根拠：`useDefaultValues.test.ts` 23〜51 行。
- 直し方の提案：
  - そのテストを `priority: "high"` → `HIGH` に直す。これが Red になる。
  - `"4"`（数値の文字列）の扱いを決めて明記する。Rails は `"4"` を返さないので、不明値として「普通」でよい。
  - `reset` 側を直すので、画面のテスト（`index.test.tsx`）にも「下書きの `priority: "high"` が選択済みで表示される」を足す。ここが画面の Red になる。現状の `index.test.tsx` の `priority: 3` は送信側の確認で、取得側ではない。

### 指摘3【重要】（観点：事実か推測か／テスト計画）
- 何が問題か：実レスポンスの確認が「了承を得てから」で止まっている。型が確定しないと、変換が必要という前提が弱い。確認できなければ「未検証」で進める書き方だが、そのときのテストは文字列と数値の両方を通す必要がある。
- 直し方の提案：次の 2 つを完了条件にする。
  - 実画面で「高い → 確認 → キャンセル」の再現を、修正前と修正後に 1 回ずつ確認する。TSK-217 の教訓のとおり、単体テストでは画面遷移は分からない。
  - 実レスポンスの確認は、画面確認のついでにネットワークタブで見れば足りる。curl は不要。

### 指摘4【軽微】（観点：共通化・置き場所）
- 何が問題か：変換の置き場所が「`constants.ts` の近く」とだけ書かれている。`CreateTaskConfirm/constants.ts` の `priorityMap`（文字列→ラベル）と、`CreateTask/constants.ts` の `PRIORITY`（数値）が別々にあり、似た対応表が増える。
- 直し方の提案：`CreateTask/constants.ts` に `PRIORITY_BY_KEY`（`very_low` → 1 …）を `PRIORITY` から作る形で置き、変換関数もそこに置く。Confirm の `priorityMap` には触らない（スコープ外）。この対応表を足す理由は、API のキーとフォームの値が別の型だから、と 1 行書いておく。

### 指摘5【軽微】（観点：完了条件）
- 何が問題か：完了条件が「戻る」ことの確認方法を指していない。
- 直し方の提案：「実画面で、高い → 確認 → キャンセルで『高い』のまま」を完了条件に足す。

## 本人に確認すべき問い
- 実画面確認のため、開発サーバーを起動してよいか。
- 過去に「普通」で登録されたタスクの扱いは、手当て不要でよいか（推測：データは修正できず、対応不要）。

関連ファイル：
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/index.tsx
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/hooks/useDefaultValues.ts
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/hooks/useDefaultValues.test.ts
- /Users/ryonakadoi/Documents/app/edu-platform/rails/app/serializers/draft_task_serializer.rb