import { handleBackendRouteError } from "@/libs/server/backend/handleBackendRouteError";
import { backendFetch } from "@/libs/server/backend/backendFetch";
import { NextResponse } from "next/server";

export async function PATCH(
  _: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;

    const { status, data, setCookie } = await backendFetch(
      `/api/v1/student/tasks/${taskId}/submission`,
      {
        method: "PATCH",
      },
    );

    const nextResponse = NextResponse.json(data, { status });

    if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

    return nextResponse;
  } catch (error) {
    return handleBackendRouteError(error, "タスクの状態更新に失敗しました");
  }
}
