import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { backendFetch } from "@/libs/server/backend/fetch";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ schoolClassId: string }> },
) {
  const { schoolClassId } = await params;

  try {
    const { data, status, setCookie } = await backendFetch(
      `/api/v1/teacher/school_classes/${schoolClassId}`,
    );

    const res = NextResponse.json(data, { status });

    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (error) {
    return handleBackendRouteError(error, "学級詳細の取得に失敗しました");
  }
}
