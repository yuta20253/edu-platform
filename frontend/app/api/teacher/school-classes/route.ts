import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { status, data, setCookie } = await railsFetch(
      "/api/v1/teacher/school_classes",
    );

    const res = NextResponse.json(data, { status });

    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (error) {
    return handleRailsRouteError(error, "学級一覧の取得に失敗しました");
  }
}
