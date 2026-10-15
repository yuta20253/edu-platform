import { handleBackendRouteError } from "@/libs/server/backend/handleBackendRouteError";
import { backendFetchMultipart } from "@/libs/server/backend/backendFetchMultipart";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  try {
    const { status, data, setCookie } = await backendFetchMultipart(
      "/api/v1/teacher/import_students/dry_run",
      formData,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "CSVの検証に失敗しました");
  }
}
