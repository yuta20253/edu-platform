import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { type NextRequest, NextResponse } from "next/server";

// 管理者お知らせ一覧の取得（page / per_page / q / status を Rails へ引き継ぐ）
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = searchParams.get("page") ?? "1";
  const perPage = searchParams.get("per_page");
  const q = searchParams.get("q");
  const status = searchParams.get("status");

  const params = new URLSearchParams({ page });
  if (perPage) params.set("per_page", perPage);
  if (q) params.set("q", q);
  if (status) params.set("status", status);

  try {
    const {
      status: railsStatus,
      data,
      setCookie,
    } = await railsFetch(`/api/v1/admin/announcements?${params.toString()}`);

    const res = NextResponse.json(data, { status: railsStatus });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "お知らせ一覧の取得に失敗しました");
  }
}
