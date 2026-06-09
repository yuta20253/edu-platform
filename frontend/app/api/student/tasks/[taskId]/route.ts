import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/student/tasks/${taskId}`,
    );

    const res = NextResponse.json(data, { status });

    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const body = await req.json();
    const { taskId } = await params;

    const { status, data, setCookie } = await railsFetch(
      `/api/v1/student/tasks/${taskId}`,
      {
        method: "PATCH",
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
