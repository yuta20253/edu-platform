import { handleBackendRouteError } from "@/libs/server/backend/handleBackendRouteError";
import { backendFetch } from "@/libs/server/backend/backendFetch";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { status, data, setCookie } = await backendFetch(
      "/api/v1/teacher/school_classes",
    );

    const res = NextResponse.json(data, { status });

    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (error) {
    return handleBackendRouteError(error, "学級一覧の取得に失敗しました");
  }
}
