import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { status, data, setCookie } = await railsFetch("/api/v1/me");

    const res = NextResponse.json(data, { status });

    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (error) {
    return handleRailsRouteError(error, "ユーザー情報の取得に失敗しました");
  }
}
