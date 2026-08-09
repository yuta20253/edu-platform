export type Announcement = {
  id: number;
  title: string;
  content: string;
  publisher: Publisher;
  published_at: string;
};

export type Publisher = {
  id: number;
  name: string;
  name_kana: string;
};

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
