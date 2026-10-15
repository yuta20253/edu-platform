import { handleBackendRouteError } from "@/libs/server/backend/handleBackendRouteError";
import { isNumericId } from "@/libs/server/routeParams";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// インポート履歴のCSVエクスポート。
// backendFetch(JSON専用) を使わず、バックエンドのレスポンス
// （Content-Type/Content-Disposition・バイナリボディ）をそのままパススルーする。
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  // id は数値IDのみ許容。不正値は バックエンドへ問い合わせる前に弾く
  if (!isNumericId(id)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  const origin = process.env.API_URL;
  if (!origin) {
    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  let response: Response;
  try {
    response = await fetch(
      `${origin}/api/v1/admin/import_histories/${id}/export`,
      {
        headers: cookieHeader ? { Cookie: cookieHeader } : {},
        cache: "no-store",
      },
    );
  } catch (error) {
    // バックエンドへの接続断など、fetch自体が例外を投げるケースを
    // 未処理例外にせず、隣接するJSONルートと同じ契約で返す
    // （BackendUnauthorizedError/BackendFetchErrorのどちらでもないため
    // 一律INTERNAL_SERVER_ERRORの500になる）
    return handleBackendRouteError(error, "CSVのエクスポートに失敗しました");
  }

  if (response.status === 401) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
  }

  if (response.status === 404) {
    return NextResponse.json({ message: "NOT_FOUND" }, { status: 404 });
  }

  if (!response.ok) {
    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: response.status },
    );
  }

  const body = await response.arrayBuffer();
  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  const contentDisposition = response.headers.get("content-disposition");
  if (contentType) headers.set("content-type", contentType);
  if (contentDisposition)
    headers.set("content-disposition", contentDisposition);

  return new NextResponse(body, { status: response.status, headers });
}
