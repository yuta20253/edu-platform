// バックエンドは Asia/Tokyo(config.time_zone)で日付を扱うため、
// 端末のタイムゾーンに関係なく日本時間の日付で揃える
const tokyoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// 指定した時刻の日本時間での日付を yyyy-MM-dd で返す
const formatTokyoDate = (date: Date) => tokyoDateFormatter.format(date);

// 日本時間の今日の日付を、端末のタイムゾーンの 0 時の Date として返す。
// date-fns の subDays・format などで日付単位の計算をそのまま行えるようにする
export const tokyoTodayAsLocalDate = (now: Date = new Date()) => {
  const [year, month, day] = formatTokyoDate(now).split("-").map(Number);
  return new Date(year, month - 1, day);
};
