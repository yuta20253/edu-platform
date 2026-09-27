import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { type NextRequest, NextResponse } from "next/server";

// お知らせの新規作成。Railsはparams.require(:announcement)を要求するため
// リクエストボディをannouncementキーでラップしてforwardする。
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, data, setCookie } = await railsFetch(
      "/api/v1/admin/announcements",
      { method: "POST", body: { announcement: body } },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "お知らせの作成に失敗しました");
  }
}
