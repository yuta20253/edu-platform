# 批判：student/CreateTask の下書き取得失敗を画面に出す（第3周・最終）

## 前回の指摘の扱いの確認
1. 指摘1（priority の string/number）：直った。事実を確認した。
   - rails/app/models/draft_task.rb の enum priority は very_low:1 … very_high:5 で、DB は integer。
   - DraftTaskSerializer は priority を素通しする。ActiveModelSerializers は enum の文字列（"normal"）を返す。これは推測で、実レスポンスは未確認。
   - CreateTaskConfirm/index.tsx:107 の priorityMap[draftTask.priority] も文字列キーで引いている。この点からも文字列が実態と言える。
   - 一方 useDefaultValues と reset は typeof priority === "number" のときだけ採用する。PRIORITY の定数は 1〜5 の数値。つまり戻ると常に「普通」になる不具合は、ほぼ確実にある。
   - 草案の扱い（テストで優先度を比べない）は妥当。ただし新指摘Aを見てください。
2. 指摘2（Props を number|null、page.tsx が null を渡す）：直った。設計・やること・既存7件の {null} への修正が書かれている。ただし新指摘Bを見てください。
3. 指摘3（単元の検証方法）：直った。チェック済み表示と POST ボディの unit_ids の2点で確かめると明記された。useSubmit が selectedUnitIds で上書きする事実にも合っている。
4. 指摘4（単元の二重管理）：直った。範囲外と明記され、完了条件も言い換わっている。
5. 指摘5（共通フックの変更）：直った。useUnitSelection の単体テスト1件と PR 説明への記載が入っている。

## 総評
第2周の指摘はすべて文面に反映され、草案内の食い違いは見つからなかった。コードとの照合でも、reset と useDefaultValues の変換が完全に同一のコピーであること、useUnitSelection の後方互換、EditTask への影響なしを確認できた。残る欠陥は、page.tsx の挙動変更と、見つけた不具合の扱いの2点だけで、どちらも数行で直せる。

## 判定
**直せば進めてよい。** 新指摘A・Bは文面の追記で済み、設計の組み替えは要らない。

## 必須観点の判定

|  | メリット | デメリット |
|---|---|---|
| 利用者（生徒） | 「キャンセル」復帰で取得に失敗したとき、空のフォームではなくエラー表示と再試行が出る。成功時の「空のフォームから内容が入る」ちらつきも消える。 | 頻度が低く実利は小さい。404 では直らない再試行が出る。取得中は入力欄の代わりにスピナーが出る。 |
| 開発チーム | 黙殺する旧フックを削除できる。初期値の流し込みが useEffect から消える。下書きありの経路に初めてテストが付く。Rails 前提は持ち込まない。 | PR が大きい。TSK-223 のマージ待ち。共通フックを触る。 |

- 両方にメリットがあるか：利用者に損がない内部整理に近い。草案もそれを正直に書いている。
- やらないことのデメリット：
  - 利用者が失うもの：まれな失敗のときに、入力が消えたように見える。
  - 開発チームが失うもの：黙殺フックと reset の重複が残る。
- 草案に無かったメリット・デメリット：草案に無い。priority の不具合は、頻度の低い取得失敗より、はるかに高い頻度で利用者に見える（指摘A）。

## 確かめた事実
- new/page.tsx は現状 Number(draftTaskId) を渡すだけで、isNumericId も notFound も使っていない。
- draftTaskId が無いときは Number(undefined) で NaN になり、draftTaskId ? … : null で null になる。
- 既存テストは draftTaskId={0} を使っている。isNumericId("0") は真になる。
- reset の本文と useDefaultValues の変換は同一（goal_id・title・content・priority・due_date・unit_ids）。削除しても挙動は変わらない。
- useUnitSelection の利用者は EditTask と CreateTask の2つ。initialIds = [] は後方互換。
- confirm/page.tsx は draft_task_id、new は draftTaskId とクエリ名が違うが、CreateTaskConfirm:139 の遷移先は draftTaskId で合っており問題ない。

## 残すべき強み
- 「回帰防止 → 移すだけ → 別コミットで整理」の3段階。
- 頻度が低く、主な理由は開発側のメリットだと正直に書いている点。
- URL 分岐のモックと、draft-tasks を含む get が無いことで確かめる新規作成のテスト。
- 案 A〜G の比較と、404 を TSK-219 後に再検討するという切り分け。
- priority の不具合をテストで固定しないと決めた判断。

## 指摘

### 指摘A【重要】（観点：スコープ・利用者のメリット）
- 何が問題か：priority の不具合を「別件。PR 説明に書く」とだけ扱っている。この不具合は、このチケットが守る「キャンセルで戻る」操作で毎回起きる。優先度を「高い」にして確認画面から戻ると、毎回「普通」に戻る。頻度の低い取得失敗より、利用者への実害は大きい。DraftTaskLoader を入れた後も、成功時に優先度が静かに壊れたままなので、直したはずの画面に一番よく起きる欠落が残る。
- 根拠：DraftTaskSerializer（priority を素通し）、draft_task.rb の enum、useDefaultValues.ts の typeof === "number"。実レスポンスは未確認（推測）。
- 直し方の提案：次のどちらかを草案に決めて書く。
  1. 別チケットを実際に起票する（「PR 説明に書く」ではなく TSK 番号を付ける）。完了条件に「別チケット作成済み」と書く。テストで優先度を比べない方針は維持する。
  2. 同じ PR の独立コミットで直す。文字列を数値に変換する関数（"normal" を 3 に）を足し、useDefaultValues で使う。直した後は優先度をテストで確かめられる。
- 私は 2 を勧める。変換は1か所（reset を消した後は useDefaultValues が唯一の入口）で済み、実害がこのチケットの主目的より大きいため。ただし実レスポンスの確認が前提で、確認できないなら 1。Go 移行で API の priority を数値にするなら変換が二度手間になるので、その場合は 1 で API 契約として決める方が筋がよい。

### 指摘B【重要】（観点：スコープ・利用者への影響）
- 何が問題か：page.tsx の変更で、これまで通っていた URL が 404 になる。
  - ?draftTaskId=0、?draftTaskId=（空）、?draftTaskId=abc は、現行では NaN や 0 になって新規作成として開いていた。草案では notFound() になるが、「利用者に見える変化」に載っていない。
  - 遷移元（確認画面の「キャンセル」）は有効な数値しか作らないので実害は小さいが、ブックマークや手入力 URL では挙動が変わる。
  - searchParams.draftTaskId が配列（?draftTaskId=1&draftTaskId=2）になる場合の扱いも書かれていない。型は string だが実際は string | string[] になりうる。
- 根拠：new/page.tsx の現行コード、routeParams.ts、confirm/page.tsx も同じ形。
- 直し方の提案：
  - 「利用者に見える変化」に「不正な draftTaskId は 404 になる」と一行足す。
  - 空文字の扱い（新規作成扱い／404）を決める。配列は notFound() に倒すと決める。
  - page.tsx の分岐（undefined → null、数値かつ >0 → 数値、それ以外 → notFound()）の単体テストを足す。直接テストする既存の例が無ければ、実画面確認に ?draftTaskId=abc を加えて代える。

### 指摘C【軽微】（観点：完了条件）
- 何が問題か：実画面確認が「行う／未検証と明記」の2択で、どちらでも完了できる。指摘Aの方針1を選ぶと、priority の実レスポンスが未確認のまま残る。
- 直し方の提案：priority の実レスポンスは curl 一発で確かめられる。完了条件に「API の priority の実際の型を確かめた（結果を PR 説明に書く）」を独立して足す。

### 指摘D【軽微】（観点：概要の整合）
- 何が問題か：第2周で指摘した「概要に reset の整理が無い」は直っていない。実害は無いが、PR 説明の素材として弱い。
- 直し方の提案：概要に「あわせて、重複する reset の useEffect を defaultValues に一本化する」を一文足す。

## 本人に確認すべき問い
1. priority の不具合（戻ると毎回「普通」になる）を、このチケットで直すか、別チケットにするか。実レスポンスを確かめたうえで、同じ PR の独立コミットで直す案を勧める。
2. 不正な draftTaskId（0・空・文字列）を 404 にして良いか。それとも新規作成として開き続けるか。
3. 頻度の低い失敗のために分割する価値があるか。開発側のメリットで進めてよいか。
4. 実画面確認を行うか。行わないなら「未検証」と明記する。

関連ファイル：
- /Users/ryonakadoi/Documents/app/edu-platform/docs/reviews/2026-10-23_student_create_task_draft_error/draft.md
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/app/(main)/(authenticated)/goals/[goalId]/tasks/new/page.tsx
- /Users/ryonakadoi/Documents/app/edu-platform/frontend/features/student/CreateTask/hooks/useDefaultValues.ts
- /Users/ryonakadoi/Documents/app/edu-platform/rails/app/serializers/draft_task_serializer.rb