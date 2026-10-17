import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") ?? "1";
  const tab = searchParams.get("tab");

  const params = new URLSearchParams({ page });
  if (tab) params.set("tab", tab);

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/teacher/announcements?${params.toString()}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "お知らせの取得に失敗しました");
  }
}

// お知らせの新規作成。Railsはparams.require(:announcement)を要求するため
// リクエストボディをannouncementキーでラップしてforwardする。
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  if (body === undefined) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await railsFetch(
      "/api/v1/teacher/announcements",
      { method: "POST", body: { announcement: body } },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "お知らせの作成に失敗しました");
  }
}
