import { backendFetch } from "@/libs/server/backend/fetch";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ highSchoolId: string }> },
) {
  try {
    const { highSchoolId } = await params;

    const { status, data } = await backendFetch(
      `/api/v1/high_schools/${highSchoolId}/grades`,
      {
        method: "GET",
      },
    );

    const nextResponse = NextResponse.json(data, { status });

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
