import { BackendUnauthorizedError } from "@/libs/server/backend/backendError";
import { backendFetch } from "@/libs/server/backend/backendFetch";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ draftTaskId: string }> },
) {
  try {
    const { draftTaskId } = await params;

    const { status, data, setCookie } = await backendFetch(
      `/api/v1/student/draft_tasks/${draftTaskId}`,
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
