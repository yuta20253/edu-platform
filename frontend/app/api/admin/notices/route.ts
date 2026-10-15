import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { type NextRequest, NextResponse } from "next/server";

// お知らせの新規作成。バックエンドはparams.require(:announcement)を要求するため
// リクエストボディをannouncementキーでラップしてforwardする。
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, data, setCookie } = await backendFetch(
      "/api/v1/admin/announcements",
      { method: "POST", body: { announcement: body } },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "お知らせの作成に失敗しました");
  }
}
