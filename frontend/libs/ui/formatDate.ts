import { format, isValid } from "date-fns";

// ISO8601 文字列を yyyy/MM/dd HH:mm 形式で表示する。
// null/undefined を含む不正な値は「-」にフォールバックする
// （started_at/finished_at のような未設定になりうる日時にも使えるように）。
export const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  return isValid(date) ? format(date, "yyyy/MM/dd HH:mm") : "-";
};

export const formatPublishedAt = (publishedAt: string) => {
  return new Date(publishedAt).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
