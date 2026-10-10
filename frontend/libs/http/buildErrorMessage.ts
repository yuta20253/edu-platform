// extractApiErrorで取り出したバリデーションエラー配列を、画面表示用の
// 1つのメッセージ文字列に変換する共通ヘルパ。
export const buildErrorMessage = (
  errors: string[] | undefined,
  fallback: string,
) => (errors && errors.length > 0 ? errors.join("\n") : fallback);
