import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const keyword = searchParams.get("keyword");
  const page = searchParams.get("page");

  const params = new URLSearchParams();
  if (keyword) params.set("keyword", keyword);
  if (page) params.set("page", page);
  const query = params.toString();

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/teacher/announcements/new${query ? `?${query}` : ""}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "配信先の取得に失敗しました");
  }
}
