import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextRequest, NextResponse } from "next/server";

// 形式(YYYY-MM-DD)だけをここで確認し、不正値は Rails へ問い合わせる前に弾く。
// 実在する日付か・from <= to か・期間の上限は Rails の Student::CalendarForm で判定する
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  const params = new URLSearchParams({ from, to });

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
