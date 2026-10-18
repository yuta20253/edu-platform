import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { status, data, setCookie } = await backendFetch(
      "/api/v1/student/account_link/preview",
      {
        method: "POST",
        body,
      },
    );

    const res = NextResponse.json(data, { status });

    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (error) {
    return handleBackendRouteError(error, "確認に失敗しました");
  }
}
