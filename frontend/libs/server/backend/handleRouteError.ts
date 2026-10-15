import { NextResponse } from "next/server";
import { BackendFetchError, BackendUnauthorizedError } from "./error";

// バックエンドへの fetch で発生した例外を Next.js の Response に変換する共通ハンドラ。
// - BackendUnauthorizedError は 401 に統一
// - BackendFetchError（422 など）は バックエンドのエラー内容（{ errors: [...] }）をそのまま返す
// - それ以外は 500
export function handleBackendRouteError(
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof BackendUnauthorizedError) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  if (error instanceof BackendFetchError) {
    let data: unknown = { errors: [fallbackMessage] };
    if (error.bodyText) {
      try {
        data = JSON.parse(error.bodyText);
      } catch {
        // パース失敗時はデフォルトのエラーメッセージを使う
      }
    }
    return NextResponse.json(data, { status: error.status });
  }

  return NextResponse.json(
    { message: "INTERNAL_SERVER_ERROR" },
    { status: 500 },
  );
}
