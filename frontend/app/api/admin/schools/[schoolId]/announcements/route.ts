import { backendFetch } from "@/libs/server/backend/backendFetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleBackendRouteError";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ schoolId: string }> };

// お知らせ一覧の取得（page を バックエンドへ引き継ぐ）
export async function GET(request: NextRequest, { params }: Params) {
  const { schoolId } = await params;
  const { searchParams } = request.nextUrl;
  const page = searchParams.get("page") ?? "1";

  try {
    const query = new URLSearchParams({ page });
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/high_schools/${schoolId}/announcements?${query.toString()}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "お知らせ一覧の取得に失敗しました");
  }
}
