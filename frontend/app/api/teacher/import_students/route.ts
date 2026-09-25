import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { railsFetchMultipart } from "@/libs/server/rails/railsFetchMultipart";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  try {
    const { status, data, setCookie } = await railsFetchMultipart(
      "/api/v1/teacher/import_students",
      formData,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "インポートの実行に失敗しました");
  }
}
