import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { isNumericId } from "@/libs/server/routeParams";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ noticeId: string }> };

// お知らせを即時配信する（下書き・予約配信 → 配信済みへの遷移）
export async function POST(_: NextRequest, { params }: Params) {
  const { noticeId } = await params;

  // noticeId は数値IDのみ許容。不正値は Rails へ問い合わせる前に弾く
  if (!isNumericId(noticeId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/announcements/${noticeId}/publish`,
      { method: "POST" },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "お知らせの配信に失敗しました");
  }
}
