import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ adminId: string }> };

// 管理者詳細の取得
export async function GET(_: NextRequest, { params }: Params) {
  const { adminId } = await params;

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/admins/${adminId}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    // 404（存在しない・削除済み）などは バックエンドのステータス・内容をそのまま返す
    return handleBackendRouteError(error, "管理者の取得に失敗しました");
  }
}

// 管理者の更新（name / email を バックエンドへ送る）
export async function PATCH(request: NextRequest, { params }: Params) {
  const { adminId } = await params;
  const body = await request.json();

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/admins/${adminId}`,
      { method: "PATCH", body },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "管理者の更新に失敗しました");
  }
}

// 管理者の削除（ソフトデリート）。自己削除・最後の管理者は バックエンドが 422 を返す。
export async function DELETE(_: NextRequest, { params }: Params) {
  const { adminId } = await params;

  try {
    const { status, setCookie } = await backendFetch(
      `/api/v1/admin/admins/${adminId}`,
      { method: "DELETE" },
    );

    const res = new NextResponse(null, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "管理者の削除に失敗しました");
  }
}
