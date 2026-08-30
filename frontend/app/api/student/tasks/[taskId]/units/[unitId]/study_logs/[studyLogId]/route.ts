import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
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
    if (error instanceof RailsUnauthorizedError) {
      return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
