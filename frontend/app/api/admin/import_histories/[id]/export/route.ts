import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// インポート履歴のCSVエクスポート。
// railsFetch(JSON専用) を使わず、Rails のレスポンス
// （Content-Type/Content-Disposition・バイナリボディ）をそのままパススルーする。
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  // id は数値IDのみ許容。不正値は Rails へ問い合わせる前に弾く
  if (!/^\d+$/.test(id)) {
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

  const response = await fetch(
    `${origin}/api/v1/admin/import_histories/${id}/export`,
    {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      cache: "no-store",
    },
  );

  if (response.status === 401) {
    return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
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
