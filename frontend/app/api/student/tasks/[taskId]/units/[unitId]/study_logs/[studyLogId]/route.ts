import { handleBackendRouteError } from "@/libs/server/backend/handleBackendRouteError";
import { backendFetch } from "@/libs/server/backend/backendFetch";
import { NextResponse } from "next/server";

export async function PATCH(
  _: Request,
  {
    params,
  }: {
    params: Promise<{ taskId: string; unitId: string; studyLogId: string }>;
  },
) {
  try {
    const { taskId, unitId, studyLogId } = await params;

    const { status, data, setCookie } = await backendFetch(
      `/api/v1/student/tasks/${taskId}/units/${unitId}/study_logs/${studyLogId}`,
      {
        method: "PATCH",
      },
    );

    const nextResponse = NextResponse.json(data, { status });

    if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

    return nextResponse;
  } catch (error) {
    return handleBackendRouteError(error, "学習記録の更新に失敗しました");
  }
}
