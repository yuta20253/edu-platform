import {
  RailsFetchError,
  RailsUnauthorizedError,
} from "@/libs/server/rails/railsError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") ?? "1";

  const params = new URLSearchParams({ page });

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/teacher/permissions?${params.toString()}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (error) {
    if (error instanceof RailsUnauthorizedError) {
      return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
    }

    if (error instanceof RailsFetchError) {
      let data: unknown = { errors: ["教員一覧の取得に失敗しました"] };
      if (error.bodyText) {
        try {
          data = JSON.parse(error.bodyText);
        } catch (error) {
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
