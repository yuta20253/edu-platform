import { Announcement } from "@/types/announcement/announcement";

type AnnouncementMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

export type AnnouncementsData = {
  announcements: Announcement[];
  meta: AnnouncementMeta;
};
