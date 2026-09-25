import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ schoolClassId: string }> },
) {
  const { schoolClassId } = await params;

  try {
    const { data, status, setCookie } = await railsFetch(
      `/api/v1/teacher/school_classes/${schoolClassId}`,
    );

    const res = NextResponse.json(data, { status });

    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (error) {
    return handleRailsRouteError(error, "学級詳細の取得に失敗しました");
  }
}
