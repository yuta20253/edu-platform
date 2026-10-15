import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ schoolId: string }> };

// 学年一覧の取得
export async function GET(_: NextRequest, { params }: Params) {
  const { schoolId } = await params;

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/high_schools/${schoolId}/grades`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "学年一覧の取得に失敗しました");
  }
}
