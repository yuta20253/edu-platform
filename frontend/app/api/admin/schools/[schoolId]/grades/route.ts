import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ schoolId: string }> };

// 学年一覧の取得
export async function GET(_: NextRequest, { params }: Params) {
  const { schoolId } = await params;

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/high_schools/${schoolId}/grades`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "学年一覧の取得に失敗しました");
  }
}
