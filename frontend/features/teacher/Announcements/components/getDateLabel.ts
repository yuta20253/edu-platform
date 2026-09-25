import { formatPublishedAt } from "@/libs/ui/formatDate";
import { AuthoredAnnouncement } from "../types";

export const getDateLabel = (announcement: AuthoredAnnouncement) => {
  if (announcement.status === "scheduled") {
    return `配信予定: ${
      announcement.scheduled_at
        ? formatPublishedAt(announcement.scheduled_at)
        : "-"
    }`;
  }

  return announcement.published_at
    ? `公開: ${formatPublishedAt(announcement.published_at)}`
    : "未公開";
};
