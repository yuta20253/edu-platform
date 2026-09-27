import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  try {
    const { goalId } = await params;

    const { status, data, setCookie } = await railsFetch(
      `/api/v1/student/goals/${goalId}`,
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

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  try {
    const { goalId } = await params;

    const { status, setCookie } = await railsFetch(
      `/api/v1/student/goals/${goalId}`,
      { method: "DELETE" },
    );

    const nextResponse = new NextResponse(null, { status });

    if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

    return nextResponse;
  } catch (error) {
    return handleRailsRouteError(error, "目標の削除に失敗しました");
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  try {
    const body = await req.json();
    const { goalId } = await params;

    const { status, data, setCookie } = await railsFetch(
      `/api/v1/student/goals/${goalId}`,
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
