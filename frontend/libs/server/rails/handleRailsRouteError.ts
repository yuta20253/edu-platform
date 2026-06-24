import { NextResponse } from "next/server";
import { RailsFetchError, RailsUnauthorizedError } from "./railsError";

// Rails への fetch で発生した例外を Next.js の Response に変換する共通ハンドラ。
// - RailsUnauthorizedError は 401 に統一
// - RailsFetchError（422 など）は Rails のエラー内容（{ errors: [...] }）をそのまま返す
// - それ以外は 500
export function handleRailsRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof RailsUnauthorizedError) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  if (error instanceof RailsFetchError) {
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
