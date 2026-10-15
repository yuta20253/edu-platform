import { backendFetch } from "@/libs/server/backend/backendFetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleBackendRouteError";
import { isNumericId } from "@/libs/server/routeParams";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ noticeId: string }> };

// お知らせ詳細の取得
export async function GET(_: NextRequest, { params }: Params) {
  const { noticeId } = await params;

  // noticeId は数値IDのみ許容。不正値は バックエンドへ問い合わせる前に弾く
  if (!isNumericId(noticeId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/announcements/${noticeId}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "お知らせの取得に失敗しました");
  }
}

// お知らせの更新。バックエンドはparams.require(:announcement)を要求するため
// リクエストボディをannouncementキーでラップしてforwardする。
export async function PATCH(request: NextRequest, { params }: Params) {
  const { noticeId } = await params;

  if (!isNumericId(noticeId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/announcements/${noticeId}`,
      { method: "PATCH", body: { announcement: body } },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "お知らせの更新に失敗しました");
  }
}
