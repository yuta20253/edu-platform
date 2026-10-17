import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { type NextRequest, NextResponse } from "next/server";

// 対象管理者にパスワード再設定メールを送信する。
// body の email を バックエンドのパスワードリセット要求エンドポイントへ転送する。
export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const { status, data, setCookie } = await backendFetch(
      "/api/v1/password/reset/request",
      { method: "POST", body },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(
      error,
      "パスワード再設定メールの送信に失敗しました",
    );
  }
}
