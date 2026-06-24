import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { type NextRequest, NextResponse } from "next/server";

// 対象管理者にパスワード再設定メールを送信する。
// body の email を Rails のパスワードリセット要求エンドポイントへ転送する。
export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const { status, data, setCookie } = await railsFetch(
      "/api/v1/password/reset/request",
      { method: "POST", body },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(
      error,
      "パスワード再設定メールの送信に失敗しました",
    );
  }
}
