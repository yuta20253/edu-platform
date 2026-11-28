import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ schoolId: string }> };

// 教師一覧の取得（page と per_page をバックエンドへ引き継ぐ）
export async function GET(request: NextRequest, { params }: Params) {
  const { schoolId } = await params;
  const { searchParams } = request.nextUrl;

  const query = new URLSearchParams({ page: searchParams.get("page") ?? "1" });
  // 件数の上限はバックエンドで制限する
  const perPage = searchParams.get("per_page");
  if (perPage) query.set("per_page", perPage);

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/high_schools/${schoolId}/teachers?${query.toString()}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "教師一覧の取得に失敗しました");
  }
}

// 教師の新規追加
export async function POST(request: NextRequest, { params }: Params) {
  const { schoolId } = await params;

  try {
    const body = await request.json();
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/high_schools/${schoolId}/teachers`,
      { method: "POST", body },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "教師の追加に失敗しました");
  }
}
