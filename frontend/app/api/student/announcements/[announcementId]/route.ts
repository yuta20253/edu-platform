import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  try {
    const { announcementId } = await params;

    const { status, data, setCookie } = await railsFetch(
      `/api/v1/student/announcements/${announcementId}`,
      {
        method: "GET",
      },
    );

    const nextResponse = NextResponse.json(data, { status });

    if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

    return nextResponse;
  } catch (error) {
    return handleRailsRouteError(error, "お知らせの取得に失敗しました");
  }
}
