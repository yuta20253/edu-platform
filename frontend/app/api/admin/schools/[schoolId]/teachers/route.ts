import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ schoolId: string }> };

// 教師一覧の取得
export async function GET(_: NextRequest, { params }: Params) {
  const { schoolId } = await params;

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/high_schools/${schoolId}/teachers`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "教師一覧の取得に失敗しました");
  }
}

// 教師の新規追加
export async function POST(request: NextRequest, { params }: Params) {
  const { schoolId } = await params;

  try {
    const body = await request.json();
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/high_schools/${schoolId}/teachers`,
      { method: "POST", body },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "教師の追加に失敗しました");
  }
}
