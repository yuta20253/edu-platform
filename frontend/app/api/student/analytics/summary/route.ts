import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { backendFetch } from "@/libs/server/backend/fetch";
import { NextRequest, NextResponse } from "next/server";

// 日付の形式・期間の妥当性は バックエンドの Student::AnalyticsPeriodForm で判定し、
// 不正なときは 422 をそのまま返す(画面側でフィルタ直下に表示する)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const params = new URLSearchParams();
  for (const key of ["from", "to"]) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }
  const query = params.toString();

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/student/analytics/summary${query ? `?${query}` : ""}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "学習分析の取得に失敗しました");
  }
}
