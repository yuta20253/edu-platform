import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { backendFetch } from "@/libs/server/backend/fetch";
import { NextResponse } from "next/server";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ taskId: string; unitId: string }> },
) {
  try {
    const { taskId, unitId } = await params;

    const { status, data, setCookie } = await backendFetch(
      `/api/v1/student/tasks/${taskId}/units/${unitId}/study_logs`,
      {
        method: "POST",
      },
    );

    const nextResponse = NextResponse.json(data, { status });

    if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

    return nextResponse;
  } catch (error) {
    return handleBackendRouteError(error, "学習記録の作成に失敗しました");
  }
}
