import { RailsFetchError, RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { type NextRequest, NextResponse } from "next/server";

// 管理者一覧の取得（page / per_page / q を Rails へ引き継ぐ）
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = searchParams.get("page") ?? "1";
  const perPage = searchParams.get("per_page");
  const q = searchParams.get("q");

  const params = new URLSearchParams({ page });
  if (perPage) params.set("per_page", perPage);
  if (q) params.set("q", q);

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/admins?${params.toString()}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    if (error instanceof RailsUnauthorizedError) {
      return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}

// 管理者の新規作成（name / email を Rails へ送る）
export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const { status, data, setCookie } = await railsFetch(
      "/api/v1/admin/admins",
      { method: "POST", body },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    if (error instanceof RailsUnauthorizedError) {
      return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
    }

    // 422 などのバリデーションエラーは Rails のエラー内容をそのまま返す
    if (error instanceof RailsFetchError) {
      let data: unknown = { errors: ["管理者の作成に失敗しました"] };
      if (error.bodyText) {
        try {
          data = JSON.parse(error.bodyText);
        } catch {
          // パース失敗時はデフォルトのエラーメッセージを使う
        }
      }
      return NextResponse.json(data, { status: error.status });
    }

    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
