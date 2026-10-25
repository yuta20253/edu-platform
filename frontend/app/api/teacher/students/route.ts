import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { BackendUnauthorizedError } from "@/libs/server/backend/error";
import { backendFetch } from "@/libs/server/backend/fetch";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") ?? "1";

  const params = new URLSearchParams({ page });
  // 面談申請フォームの生徒検索で使う。件数の上限は バックエンドで制限する
  const perPage = searchParams.get("per_page");
  if (perPage) params.set("per_page", perPage);
  // 生徒名の検索なので、長い文字列をそのまま LIKE 検索へ渡さないよう 100 文字までにする
  const keyword = searchParams.get("keyword")?.trim().slice(0, 100);
  if (keyword) params.set("keyword", keyword);

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/teacher/students?${params.toString()}`,
    );

    const res = NextResponse.json(data, { status });

    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (error) {
    if (error instanceof BackendUnauthorizedError) {
      return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, data, setCookie } = await backendFetch(
      "/api/v1/teacher/students",
      { method: "POST", body },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "生徒の新規作成に失敗しました");
  }
}
