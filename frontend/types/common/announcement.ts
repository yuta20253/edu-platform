// 管理者お知らせ(Api::V1::Admin::AnnouncementsController)のstatus enumに対応する型。
// 管理画面の複数機能（お知らせ一覧・作成編集・高校詳細タブ）で共有する。
export type AnnouncementStatus = "draft" | "scheduled" | "published";
