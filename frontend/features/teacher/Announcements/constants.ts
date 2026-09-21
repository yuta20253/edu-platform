import { AnnouncementStatus } from "./types";

export const STATUS_LABEL: Record<AnnouncementStatus, string> = {
  draft: "下書き",
  scheduled: "予約中",
  published: "公開済み",
};

export const STATUS_COLOR: Record<
  AnnouncementStatus,
  "default" | "warning" | "success"
> = {
  draft: "default",
  scheduled: "warning",
  published: "success",
};
