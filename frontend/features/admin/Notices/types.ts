import type { AnnouncementStatus } from "@/types/common/announcement";

export type NoticeStatus = AnnouncementStatus;

export type NoticePublisher = {
  id: number;
  name: string;
  name_kana: string;
};

// GET /api/admin/announcements（Admin::AnnouncementListSerializer）のレスポンス形状。
// target_typeは常に"all_users"（管理者は全ユーザー配信のみ）だが、
// 一覧の表示ロジックはこの値を見ずに固定文字列を出す。
export type Notice = {
  id: number;
  title: string;
  status: NoticeStatus;
  target_type: string;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  publisher: NoticePublisher;
};

export type NoticesMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

export type NoticesData = {
  announcements: Notice[];
  meta: NoticesMeta;
};
