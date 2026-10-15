import { backendFetch } from "@/libs/server/backend/fetch";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data, status } = await backendFetch("/api/v1/prefectures", {
      method: "GET",
    });

    const nextResponse = NextResponse.json(data, { status });

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
