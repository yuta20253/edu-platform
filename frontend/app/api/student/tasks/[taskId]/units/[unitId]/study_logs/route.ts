import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextResponse } from "next/server";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ taskId: string; unitId: string }> },
) {
  try {
    const { taskId, unitId } = await params;

    const { status, data, setCookie } = await railsFetch(
      `/api/v1/student/tasks/${taskId}/units/${unitId}/study_logs`,
      {
        method: "POST",
      },
    );

    const nextResponse = NextResponse.json(data, { status });

    if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

    return nextResponse;
  } catch (error) {
    return handleRailsRouteError(error, "学習記録の作成に失敗しました");
  }
}
