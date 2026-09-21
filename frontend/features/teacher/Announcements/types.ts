import { Announcement } from "@/types/announcement/announcement";

export type AnnouncementTab = "received" | "authored";

export type AnnouncementStatus = "draft" | "scheduled" | "published";

export type AuthoredAnnouncement = {
  id: number;
  title: string;
  content: string;
  status: AnnouncementStatus;
  published_at: string | null;
  scheduled_at: string | null;
};

export type AnnouncementMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

export type ReceivedAnnouncementsData = {
  announcements: Announcement[];
  meta: AnnouncementMeta;
};

export type AuthoredAnnouncementsData = {
  announcements: AuthoredAnnouncement[];
  meta: AnnouncementMeta;
};

export type AnnouncementsResult =
  | { tab: "received"; data: ReceivedAnnouncementsData }
  | { tab: "authored"; data: AuthoredAnnouncementsData };
