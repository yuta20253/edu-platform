import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ schoolId: string }> };

// お知らせ一覧の取得（page を Rails へ引き継ぐ）
export async function GET(request: NextRequest, { params }: Params) {
  const { schoolId } = await params;
  const { searchParams } = request.nextUrl;
  const page = searchParams.get("page") ?? "1";

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/high_schools/${schoolId}/announcements?page=${page}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "お知らせ一覧の取得に失敗しました");
  }
}
