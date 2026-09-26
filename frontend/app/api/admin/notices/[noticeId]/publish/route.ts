import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ noticeId: string }> };

// お知らせを即時配信する（下書き・予約配信 → 配信済みへの遷移）
export async function POST(_: NextRequest, { params }: Params) {
  const { noticeId } = await params;

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
