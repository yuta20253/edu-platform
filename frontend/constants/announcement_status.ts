import { AnnouncementStatus } from "@/types/common/announcement";

// お知らせステータスの日本語ラベル。
export const announcementStatusLabel: Record<AnnouncementStatus, string> = {
  draft: "下書き",
  scheduled: "予約配信",
  published: "配信済み",
};

// MUI の color prop 用の色マップ。Chip などに直接渡す画面で使う。
export const announcementStatusColor: Record<
  AnnouncementStatus,
  "default" | "info" | "success"
> = {
  draft: "default",
  scheduled: "info",
  published: "success",
};
