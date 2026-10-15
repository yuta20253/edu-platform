import { handleBackendRouteError } from "@/libs/server/backend/handleBackendRouteError";
import { backendFetch } from "@/libs/server/backend/backendFetch";
import { isNumericId } from "@/libs/server/routeParams";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// インポート履歴詳細の取得
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  // id は数値IDのみ許容。不正値は バックエンドへ問い合わせる前に弾く
  if (!isNumericId(id)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/import_histories/${id}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "インポート履歴の取得に失敗しました");
  }
}
