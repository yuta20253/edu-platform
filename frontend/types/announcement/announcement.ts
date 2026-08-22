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
