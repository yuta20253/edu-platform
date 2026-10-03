import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { isNumericId } from "@/libs/server/routeParams";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ announcementId: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { announcementId } = await params;

    const { status, data, setCookie } = await railsFetch(
      `/api/v1/teacher/announcements/${announcementId}`,
      { method: "GET" },
    );

    const nextResponse = NextResponse.json(data, { status });
    if (setCookie) nextResponse.headers.set("set-cookie", setCookie);
    return nextResponse;
  } catch (error) {
    return handleRailsRouteError(error, "お知らせの取得に失敗しました");
  }
}

// お知らせのステータス更新(公開・予約投稿)。Railsはparams.require(:announcement)を要求するため
// リクエストボディをannouncementキーでラップしてforwardする。
export async function PATCH(request: NextRequest, { params }: Params) {
  const { announcementId } = await params;

  if (!isNumericId(announcementId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/teacher/announcements/${announcementId}`,
      { method: "PATCH", body: { announcement: body } },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "お知らせの更新に失敗しました");
  }
}
