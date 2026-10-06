import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // 形式・範囲のバリデーションは Rails の Student::CalendarForm に任せ、ここでは転送のみ行う
  const params = new URLSearchParams();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/student/calendar?${params.toString()}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "カレンダーの取得に失敗しました");
  }
}
