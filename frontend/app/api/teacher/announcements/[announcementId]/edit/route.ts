import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { isNumericId } from "@/libs/server/routeParams";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ announcementId: string }> };

// 編集画面の初期値(自分が作成した下書き・予約投稿)の取得。
// 受信者向けの詳細(GET /api/teacher/announcements/:id)は配信済みしか返さないため別に用意する。
export async function GET(_: Request, { params }: Params) {
  const { announcementId } = await params;

  if (!isNumericId(announcementId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/teacher/announcements/${announcementId}/edit`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "お知らせの取得に失敗しました");
  }
}
