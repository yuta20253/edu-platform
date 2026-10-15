import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  try {
    const { announcementId } = await params;

    const { status, data, setCookie } = await backendFetch(
      `/api/v1/student/announcements/${announcementId}`,
      {
        method: "GET",
      },
    );

    const nextResponse = NextResponse.json(data, { status });

    if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

    return nextResponse;
  } catch (error) {
    return handleBackendRouteError(error, "お知らせの取得に失敗しました");
  }
}
