import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ schoolId: string }> };

// 割当済みコース一覧の取得
export async function GET(_: NextRequest, { params }: Params) {
  const { schoolId } = await params;

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/high_schools/${schoolId}/course_assignments`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "コース割当一覧の取得に失敗しました");
  }
}

// コースの割当
export async function POST(request: NextRequest, { params }: Params) {
  const { schoolId } = await params;
  const body = await request.json();

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/high_schools/${schoolId}/course_assignments`,
      { method: "POST", body },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "コースの割当に失敗しました");
  }
}
