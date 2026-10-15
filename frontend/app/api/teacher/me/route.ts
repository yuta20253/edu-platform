import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { backendFetch } from "@/libs/server/backend/fetch";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { status, data, setCookie } = await backendFetch("/api/v1/me");

    const res = NextResponse.json(data, { status });

    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (error) {
    return handleBackendRouteError(error, "ユーザー情報の取得に失敗しました");
  }
}
