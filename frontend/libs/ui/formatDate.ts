import { format, isValid } from "date-fns";

// ISO8601 文字列を yyyy/MM/dd HH:mm 形式で表示する。
// 不正な値は「-」にフォールバックする。
export const formatDateTime = (value: string) => {
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
