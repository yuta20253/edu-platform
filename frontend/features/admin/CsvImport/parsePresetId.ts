// URLから受け取った講座ID・単元IDの候補値を検証する。
// 数値でない・0以下の値は不正なプリセットとしてnullにフォールバックする
// （呼び出し側はisPreset判定に!= nullを使うため、NaNをそのまま渡すと
// 「プリセットあり」と誤判定されウィザードが無反応になる）。
export const parsePresetId = (
  value: string | null | undefined,
): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
