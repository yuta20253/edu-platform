import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { NextResponse } from "next/server";

// 面談申請先として選べる、自分の学級の担当教員一覧
export async function GET() {
  try {
    const { status, data, setCookie } = await railsFetch(
      "/api/v1/student/teachers",
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "教員一覧の取得に失敗しました");
  }
}
