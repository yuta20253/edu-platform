import { BackendUnauthorizedError } from "@/libs/server/backend/error";
import { backendFetch } from "@/libs/server/backend/fetch";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.toString();

    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/addresses?${query}`,
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
