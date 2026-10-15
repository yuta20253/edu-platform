import { BackendUnauthorizedError } from "@/libs/server/backend/error";
import { backendFetch } from "@/libs/server/backend/fetch";
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

    const { status, data, setCookie } = await backendFetch(
      `/api/v1/student/tasks/${taskId}/units/${unitId}/confirmation${query}`,
      {
        method: "GET",
      },
    );

    const nextResponse = NextResponse.json(data, { status });

    if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

    return nextResponse;
  } catch (error) {
    if (error instanceof BackendUnauthorizedError) {
      return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
