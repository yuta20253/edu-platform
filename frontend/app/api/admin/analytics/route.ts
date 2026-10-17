import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { type NextRequest, NextResponse } from "next/server";

const FORWARD_PARAM_KEYS = [
  "from",
  "to",
  "high_school_id",
  "subject_id",
] as const;

// 分析・レポート集計の取得
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = new URLSearchParams();
  for (const key of FORWARD_PARAM_KEYS) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/analytics?${params.toString()}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "分析データの取得に失敗しました");
  }
}
