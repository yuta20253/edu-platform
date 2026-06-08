import {
  RailsFetchError,
  RailsUnauthorizedError,
} from "@/libs/server/rails/railsError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ adminId: string }> };

// 管理者詳細の取得
export async function GET(_: NextRequest, { params }: Params) {
  const { adminId } = await params;

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/admins/${adminId}`,
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

// 管理者の更新（name / email を Rails へ送る）
export async function PATCH(request: NextRequest, { params }: Params) {
  const { adminId } = await params;
  const body = await request.json();

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/admins/${adminId}`,
      { method: "PATCH", body },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleMutationError(error, "管理者の更新に失敗しました");
  }
}

// 管理者の削除（ソフトデリート）。自己削除・最後の管理者は Rails が 422 を返す。
export async function DELETE(_: NextRequest, { params }: Params) {
  const { adminId } = await params;

  try {
    const { status, setCookie } = await railsFetch(
      `/api/v1/admin/admins/${adminId}`,
      { method: "DELETE" },
    );

    const res = new NextResponse(null, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleMutationError(error, "管理者の削除に失敗しました");
  }
}

// 更新・削除の共通エラーハンドリング。
// 401 は専用、422 などは Rails のエラー内容（{ errors: [...] }）をそのまま返す。
function handleMutationError(error: unknown, fallbackMessage: string) {
  if (error instanceof RailsUnauthorizedError) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  if (error instanceof RailsFetchError) {
    let data: unknown = { errors: [fallbackMessage] };
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
