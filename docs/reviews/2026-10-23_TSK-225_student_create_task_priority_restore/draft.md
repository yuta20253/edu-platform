## 概要

タスク作成の確認画面から「キャンセル」で戻ると、入力済みの**優先度が毎回「普通」に戻る**不具合を直す。`useDefaultValues`（と、重複する `reset` の `useEffect`）が、下書きの `priority` を `typeof === "number"` のときだけ採用するが、Rails は enum を**文字列**（`"high"` など）で返す見込みのため、常に「普通」になる。

「CreateTask の下書き取得失敗を画面に出す」(TSK-226)の設計レビュー（第2・3周）で見つかった件。

## 背景(調査結果)

- `rails/app/models/draft_task.rb`: `enum priority: { very_low: 1, low: 2, normal: 3, high: 4, very_high: 5 }`。シリアライザは `priority` を素通しする。
- `CreateTaskConfirm` の `priorityMap[draftTask.priority]` は**文字列キー**で引いている（表示は動いている）。
- `DraftTaskType.priority: string`。
- `CreateTask/hooks/useDefaultValues.ts`: `typeof draftTask.priority === "number" ? draftTask.priority : PRIORITY.NORMAL`。`PRIORITY` は 1〜5 の数値。文字列が来れば常に `NORMAL`。
- 影響: 優先度を「高い」にして確認画面へ進み「キャンセル」で戻ると、毎回「普通」になる。タイトル・内容・期限・単元は戻る。

### 未検証の前提

| 前提 | 確かめる方法 |
| --- | --- |
| API の `priority` は実際に文字列で返る | 実画面のネットワークタブで（画面確認のついで。curl は不要） `/draft-tasks/:id` の `priority` を見る（オーナーの了承を得てから） |
| 実画面で、戻ると「普通」になる | 実画面（高い → 確認 → キャンセル）で再現する |

## 設計

- 文字列→数値の変換（`"very_low"→1 … "very_high"→5`）を、`PRIORITY` と同じ `constants.ts` の近くに置き、`useDefaultValues` で使う。数値が来た場合は **1〜5 の範囲だけ**採用する（Go 移行などで API が数値に変わっても壊れない）。範囲外（`0`・`6`・`NaN`）と不明な値は「普通」。
- 変換は1つの関数（例: `toPriorityValue(raw: unknown): number`）にし、`CreateTask/constants.ts` に置く。`PRIORITY` から `PRIORITY_BY_KEY`（`very_low`→1 …）を作る。API のキー（文字列）とフォームの値（数値）が別の型だから、対応表が要る。`CreateTaskConfirm` の `priorityMap` には触らない（スコープ外）。
- **`index.tsx` の `reset` の `useEffect` も、同じ関数を使う**（必須）。`draftTask` は非同期取得なので、初期の `defaultValues` は空で、画面に下書きの値を入れているのは `reset` 側。`useDefaultValues` だけ直しても画面は直らない。
- 「`"4"`（数値の文字列）」は Rails が返さないので、不明値として「普通」。

## 比較した案

| 案 | 判断 | 理由 |
| --- | --- | --- |
| A: フロントで文字列→数値に変換 | 採用 | 1か所で済む。API は触らない |
| B: Rails が数値を返すようにする | 不採用 | API 契約の変更で、他画面（確認画面の `priorityMap`）にも波及する |

## やること

- [ ] 実画面のネットワークタブで、`priority` の型と、戻ったときの不具合を再現する（了承を得て。得られなければ PR 説明に「未検証」と明記。実装は止めない）

### 回帰防止（現行でも通る。最初にコミットする）

- [ ] `useDefaultValues.test.ts` の既存ケース「`priority: "4"` → `NORMAL`」は、テスト名で特定し、削除せず「不明値は `NORMAL`」の独立したケースとして残す。数値（`PRIORITY.HIGH`）のケースも残る

### Red（落ちることを確認してからコミットする）

- [ ] `useDefaultValues.test.ts`: `priority: "high"` → `PRIORITY.HIGH`（新しいケースとして足す。現行は `NORMAL`）
- [ ] `toPriorityValue` の単体テスト: 全5キー（`very_low`〜`very_high`）、数値（1〜5）、範囲外（`0`・`6`）、`"4"`、`null` / `undefined`。5キーの網羅で `PRIORITY_BY_KEY` の綴りが Rails の enum（`draft_task.rb`）と一致することを確かめる（新規ファイルなのでインポートで落ちる）
- [ ] `CreateTask/index.test.tsx`: `draftTaskId` を有効な数値にし、`apiClient.get` を **URL で出し分ける**（`draft-tasks` を含めば下書き、それ以外は `mockCourses`）。`mockResolvedValueOnce` は漏れやすいので使わず、`beforeEach` で `mockReset`。下書きの `priority: "high"` で、`findBy` / `waitFor` で優先度のセレクトに「高い」が出るのを待つ（取得は非同期。同期の `getBy` は使わない）。取得後に「高い」が出ることだけを判定する（取得前の「普通」は判定しない。保留 Promise が要り、Red の判定には不要なため）
- [ ] 上の画面テストは、`useDefaultValues` だけ直して `reset` を直さない状態では落ちたまま（`reset` が必須である証明）。順序: `toPriorityValue` → `useDefaultValues` → `reset` と、段階ごとに確認する

### Green

- [ ] `toPriorityValue` を足し、`useDefaultValues` と `reset` の両方で使う

## 完了条件

- [ ] 下書きの優先度（文字列）がフォームに戻る。実画面で「高い → 確認 → キャンセル」が「高い」のまま（修正前の再現と修正後の確認。行わなければ「未検証」と明記）
- [ ] 数値でも文字列でも、不明な値は「普通」
- [ ] 実画面確認の際、コンソールに MUI の `Select` の value 警告が出ていない
- [ ] `npm run test` / `lint` / `format:check` / `typecheck` が通る

## 依存

- 「CreateTask の下書き取得失敗を画面に出す」チケットとは**独立してマージできる**。このチケットが先なら、`reset` と `useDefaultValues` の両方を直す。後続チケット側には「`useDefaultValues` が `toPriorityValue` を使っていること」を完了条件として足す（後続の `reset` の一本化で変換が失われないため）。
