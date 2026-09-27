import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { isNumericId } from "@/libs/server/routeParams";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ noticeId: string }> };

// お知らせ詳細の取得
export async function GET(_: NextRequest, { params }: Params) {
  const { noticeId } = await params;

  // noticeId は数値IDのみ許容。不正値は Rails へ問い合わせる前に弾く
  if (!isNumericId(noticeId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/announcements/${noticeId}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "お知らせの取得に失敗しました");
  }
}

// お知らせの更新。Railsはparams.require(:announcement)を要求するため
// リクエストボディをannouncementキーでラップしてforwardする。
export async function PATCH(request: NextRequest, { params }: Params) {
  const { noticeId } = await params;

  if (!isNumericId(noticeId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/announcements/${noticeId}`,
      { method: "PATCH", body: { announcement: body } },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "お知らせの更新に失敗しました");
  }
}

// お知らせの削除。配信済みのお知らせはRailsが422を返す。
export async function DELETE(_: NextRequest, { params }: Params) {
  const { noticeId } = await params;

  try {
    const { status, setCookie } = await railsFetch(
      `/api/v1/admin/announcements/${noticeId}`,
      { method: "DELETE" },
    );

    const res = new NextResponse(null, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "お知らせの削除に失敗しました");
  }
}
