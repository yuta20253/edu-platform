import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const { studentId } = await params;
  const { searchParams } = req.nextUrl;
  const tab = searchParams.get("tab");
  const page = searchParams.get("page");

  const query = new URLSearchParams();
  if (tab) query.set("tab", tab);
  if (page) query.set("page", page);
  const queryString = query.toString();

  try {
    const { data, status, setCookie } = await backendFetch(
      `/api/v1/teacher/students/${studentId}${queryString ? `?${queryString}` : ""}`,
    );

    const res = NextResponse.json(data, { status });

    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (error) {
    return handleBackendRouteError(error, "生徒情報の取得に失敗しました");
  }
}
