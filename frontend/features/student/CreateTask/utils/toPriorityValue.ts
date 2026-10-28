import { PRIORITY, PRIORITY_BY_KEY, PRIORITY_VALUES } from "../constants";

// API の優先度をフォームの値に変換する。文字列(キー)でも、1〜5 の数値でも受け付け、
// それ以外(範囲外・不明な値・null など)は「普通」にする。
export const toPriorityValue = (raw: unknown): number => {
  if (
    typeof raw === "string" &&
    Object.prototype.hasOwnProperty.call(PRIORITY_BY_KEY, raw)
  ) {
    return PRIORITY_BY_KEY[raw];
  }

  if (typeof raw === "number" && PRIORITY_VALUES.includes(raw)) {
    return raw;
  }

  return PRIORITY.NORMAL;
};
