import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ schoolId: string; teacherId: string }> };

// 教師の更新
export async function PATCH(request: NextRequest, { params }: Params) {
  const { schoolId, teacherId } = await params;

  try {
    const body = await request.json();
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/high_schools/${schoolId}/teachers/${teacherId}`,
      { method: "PATCH", body },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "教師の更新に失敗しました");
  }
}
