import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextResponse } from "next/server";

export async function PATCH(
  _: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await params;

    const { status, data, setCookie } = await railsFetch(
      `/api/v1/student/tasks/${taskId}/submission`,
      {
        method: "PATCH",
      },
    );

    const nextResponse = NextResponse.json(data, { status });

    if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

    return nextResponse;
  } catch (error) {
    return handleRailsRouteError(error, "タスクの状態更新に失敗しました");
  }
}
