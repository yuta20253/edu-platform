import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { backendFetch } from "@/libs/server/backend/fetch";
import { NextRequest, NextResponse } from "next/server";

// 形式(YYYY-MM-DD)だけをここで確認し、不正値は バックエンドへ問い合わせる前に弾く。
// 実在する日付か・from <= to か・期間の上限は バックエンドの CalendarPeriodForm で判定する
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// カレンダーは表示範囲(最大6週)の面談を1回で取得する。バックエンドの per_page の上限
const PER_PAGE = "100";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  const params = new URLSearchParams({ from, to, per_page: PER_PAGE });

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/teacher/interview_requests?${params.toString()}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "カレンダーの取得に失敗しました");
  }
}
