import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { backendFetch } from "@/libs/server/backend/fetch";
import { type NextRequest, NextResponse } from "next/server";

const FORWARD_PARAM_KEYS = [
  "page",
  "per_page",
  "status",
  "course_id",
  "unit_id",
  "user_id",
  "from",
  "to",
  "sort",
  "order",
] as const;

// インポート履歴一覧の取得
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = new URLSearchParams();
  for (const key of FORWARD_PARAM_KEYS) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/import_histories?${params.toString()}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "インポート履歴の取得に失敗しました");
  }
}
