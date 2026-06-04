import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string; unitId: string }> },
) {
  try {
    const { taskId, unitId } = await params;

    const { searchParams } = new URL(request.url);

    const answeredQuestionIds = searchParams.get("answered_question_ids");

    const query = answeredQuestionIds
      ? `?answered_question_ids=${answeredQuestionIds}`
      : "";

    const { status, data, setCookie } = await railsFetch(
      `/api/v1/student/tasks/${taskId}/units/${unitId}/confirmation${query}`,
      {
        method: "GET",
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
