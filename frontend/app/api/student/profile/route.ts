import { BackendUnauthorizedError } from "@/libs/server/backend/backendError";
import { backendFetch } from "@/libs/server/backend/backendFetch";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const { status, data, setCookie } = await backendFetch(`/api/v1/profile`, {
      method: "PATCH",
      body,
    });

    const nextResponse = NextResponse.json(data, { status });

    if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

    return nextResponse;
  } catch (error) {
    console.error(error);
    if (error instanceof BackendUnauthorizedError) {
      return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
