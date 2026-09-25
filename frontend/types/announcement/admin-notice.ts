import type { AnnouncementStatus } from "@/types/common/announcement";

export type AdminNoticeStatus = AnnouncementStatus;

export type AdminNoticePublisher = {
  id: number;
  name: string;
  name_kana: string;
};

// GET /api/admin/notices/:id（Admin::AnnouncementDetailSerializer）のレスポンス形状。
// target_typeは常に"all_users"（管理者が作成するお知らせは全ユーザー配信固定のため）。
export type AdminNoticeDetail = {
  id: number;
  title: string;
  content: string;
  status: AdminNoticeStatus;
  target_type: "all_users";
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  publisher: AdminNoticePublisher;
};

// POST /api/admin/notices（新規作成）で送る入力。
export type CreateNoticeInput = {
  title: string;
  content: string;
  status: AdminNoticeStatus;
  scheduled_at: string | null;
};

// PATCH /api/admin/notices/:id（更新）で送る入力。
// statusとscheduled_atは配信タイミングを変更する場合のみ含める。
// 省略した場合、Rails側は該当フィールドを変更しない（部分更新）。
export type UpdateNoticeInput = {
  title: string;
  content: string;
  status?: Extract<AdminNoticeStatus, "draft" | "scheduled">;
  scheduled_at?: string | null;
};
