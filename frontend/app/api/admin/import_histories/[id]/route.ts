import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// インポート履歴詳細の取得
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/import_histories/${id}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "インポート履歴の取得に失敗しました");
  }
}
