import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") ?? "1";
  const tab = searchParams.get("tab");

  const params = new URLSearchParams({ page });
  if (tab) params.set("tab", tab);

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/teacher/announcements?${params.toString()}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "お知らせの取得に失敗しました");
  }
}

// お知らせの新規作成。バックエンドはparams.require(:announcement)を要求するため
// リクエストボディをannouncementキーでラップしてforwardする。
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  if (body === undefined) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      "/api/v1/teacher/announcements",
      { method: "POST", body: { announcement: body } },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "お知らせの作成に失敗しました");
  }
}
