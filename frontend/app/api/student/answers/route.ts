import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextResponse } from "next/server";
import { isAnswerRequestBody } from "./validation";

export async function POST(req: Request) {
  return forwardAnswerRequest("POST", req);
}

export async function PATCH(req: Request) {
  return forwardAnswerRequest("PATCH", req);
}

async function forwardAnswerRequest(method: "POST" | "PATCH", req: Request) {
  try {
    const body = await req.json();

    if (!isAnswerRequestBody(body)) {
      return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
    }

    const { status, data, setCookie } = await railsFetch(
      `/api/v1/student/tasks/${body.task_id}/units/${body.unit_id}/answers`,
      {
        method,
        body,
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
