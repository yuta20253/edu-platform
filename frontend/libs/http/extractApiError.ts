// apiClient（axios）が投げたエラーから、レスポンスの status と
// バリデーションエラー配列（{ errors: [...] }）を安全に取り出す共通ヘルパ。
// 各フックでエラーの形を毎回ナローイングするのを避ける。
export type ApiError = {
  status?: number;
  errors?: string[];
};

export const extractApiError = (err: unknown): ApiError => {
  const response =
    err && typeof err === "object" && "response" in err
      ? (
          err as {
            response?: { status?: number; data?: { errors?: string[] } };
          }
        ).response
      : undefined;

  const errors = response?.data?.errors;

  return {
    status: response?.status,
    errors: Array.isArray(errors) && errors.length > 0 ? errors : undefined,
  };
};
