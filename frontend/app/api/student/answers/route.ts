import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { status, data, setCookie } = await railsFetch(
      `/api/v1/student/tasks/${body.task_id}/units/${body.unit_id}/answers`,
      {
        method: "POST",
        body: {
          task_id: body.task_id,
          unit_id: body.unit_id,
          question_id: body.question_id,
          question_choice_id: body.question_choice_id,
        },
      },
    );

    const nextResponse = NextResponse.json(data, { status });

    if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

    return nextResponse;
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    }
    if (error instanceof RailsUnauthorizedError) {
      return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
