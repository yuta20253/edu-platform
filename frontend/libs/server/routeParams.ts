// 動的ルートセグメント（[id] など）の値検証。
// 数値ID以外を Rails へ問い合わせる前に弾くために使う。
const NUMERIC_ID_PATTERN = /^\d+$/;

export const isNumericId = (value: string): boolean =>
  NUMERIC_ID_PATTERN.test(value);
