import { format, isValid, parseISO } from "date-fns";

export const dateToInput = (value: string) => (value ? parseISO(value) : null);

export const dateToParam = (date: Date | null) =>
  date && isValid(date) ? format(date, "yyyy-MM-dd") : "";

export const formatDateTime = (value: string) => {
  const date = new Date(value);
  return isValid(date) ? format(date, "yyyy/MM/dd HH:mm") : "-";
};
