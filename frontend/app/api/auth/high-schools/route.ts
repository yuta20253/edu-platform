import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword");

    const { status, data } = await railsFetch(
      `/api/v1/high_schools?keyword=${keyword}`,
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
