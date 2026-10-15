import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { type NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> },
) {
  const { teacherId } = await params;
  const body = await request.json();

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/teacher/permissions/${teacherId}`,
      { method: "PATCH", body },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "権限の更新に失敗しました");
  }
}
