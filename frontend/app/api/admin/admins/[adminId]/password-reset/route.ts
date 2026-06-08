import {
  RailsFetchError,
  RailsUnauthorizedError,
} from "@/libs/server/rails/railsError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
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
    if (error instanceof RailsUnauthorizedError) {
      return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
    }

    if (error instanceof RailsFetchError) {
      let data: unknown = {
        errors: ["パスワード再設定メールの送信に失敗しました"],
      };
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
}
