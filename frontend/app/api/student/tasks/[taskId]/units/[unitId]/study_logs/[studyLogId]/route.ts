import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
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

    const { status, data, setCookie } = await railsFetch(
      `/api/v1/student/tasks/${taskId}/units/${unitId}/study_logs/${studyLogId}`,
      {
        method: "PATCH",
      },
    );

    const nextResponse = NextResponse.json(data, { status });

    if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

    return nextResponse;
  } catch (error) {
    return handleRailsRouteError(error, "学習記録の更新に失敗しました");
  }
}
