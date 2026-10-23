# 第2周の対応(CreateTaskConfirm)

第2周の判定: **直せば進めてよい**

| 指摘 | 重大度 | 対応 | 理由・草案のどこを直したか |
| --- | --- | --- | --- |
| 1. `useFetchDraftTask` は別画面 `CreateTask` が使っており、草案どおり削除するとビルドが壊れる | 致命的 | 採用 | コードで確認した(`CreateTask/index.tsx` の import と呼び出し)。第1周の対応で「削除対象」を確かめていなかった。案(a)を採用: **削除するのは `CreateTaskConfirm/useFetchGoal.ts` とそのテストだけ**にし、`useFetchDraftTask.ts` は残す。`CreateTask` の黙殺は別件(案 F)として「その他」に記録した。完了条件に「`index.tsx` が `useFetchDraftTask` を import していない」「`CreateTask` の既存のテストが変更なしで通る」を足した |
| 2. ID の検証は既存の `isNumericId` を使う。`Number.isInteger` は `"1e3"` や配列を通す | 重要 | 採用 | コードで確認した(`libs/server/routeParams.ts`、admin の `page.tsx`)。`isNumericId` で文字列のまま検証し、`undefined`・配列も不合格にする。`"0"` は `isNumericId` を通るので `Number(x) > 0` を併用して 404 にする。`page.tsx` のテストは、無い・空・英字・`"0"`・配列・正常のパターンにした |
| 3. `DraftTaskType` の移動先で、`types.ts` の `UnitType` / `CourseType` と名前が衝突する | 重要 | 採用 | コードで確認した(形が違う)。`DraftTaskUnitType` / `DraftTaskCourseType` の別名にし、4か所の import を直す。既存の `UnitType` / `CourseType` の利用状況は `grep` で確かめてから決めると書いた |
| 4. 「取得中はスピナー」は、現行でも `Backdrop` の `progressbar` が出るので Red にならない | 軽微 | 採用 | Red の条件を「取得が未解決の間、確認画面の中身(見出し、「登録する」ボタン)が DOM に無く、スピナーだけが出る」に書き換えた |
| 5. 一度成功した側の再取得が失敗した場合の挙動が書かれていない | 軽微 | 採用 | 「確認画面は消えてエラー表示になる(許容する)」と設計に1行足した |

## 本人に確認すべき問い(手順5で聞く)

1. `CreateTask` の黙殺を別チケットにするか(今回は案 (a) で触らない)。
2. Calendar を対象外にして、TSK-216 側で扱うことでよいか。
3. 不正 ID は 404(`notFound()`)でよいか。
4. 実画面確認を行うか(`CreateTask` が `useFetchDraftTask` を残すので、「新規タスク作成 → 確認 → 登録」の通し確認は重要)。
