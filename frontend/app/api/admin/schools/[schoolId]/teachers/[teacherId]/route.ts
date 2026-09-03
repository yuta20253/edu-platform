import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ schoolId: string; teacherId: string }> };

// 教師の更新
export async function PATCH(request: NextRequest, { params }: Params) {
  const { schoolId, teacherId } = await params;

  try {
    const body = await request.json();
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/high_schools/${schoolId}/teachers/${teacherId}`,
      { method: "PATCH", body },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "教師の更新に失敗しました");
  }
}
