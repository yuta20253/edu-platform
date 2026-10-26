import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { isNumericId } from "@/libs/server/routeParams";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ schoolClassRequestId: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { schoolClassRequestId } = await params;

  if (!isNumericId(schoolClassRequestId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/teacher/school_class_requests/${schoolClassRequestId}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "学級申請の取得に失敗しました");
  }
}

// 承認/却下。楽観ロックのため lock_version を必ず送る(他の教員が先に処理していれば バックエンドが 409 を返す)。
// バックエンドはparams.require(:school_class_request)を要求するため、必要なキーだけをラップしてforwardする。
export async function PATCH(req: NextRequest, { params }: Params) {
  const { schoolClassRequestId } = await params;

  if (!isNumericId(schoolClassRequestId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  // 必要なキーだけ取り出して転送するため、オブジェクト以外(null・配列など)は弾く
  const body = await req.json().catch(() => undefined);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/teacher/school_class_requests/${schoolClassRequestId}`,
      {
        method: "PATCH",
        body: {
          school_class_request: {
            status: body.status,
            lock_version: body.lock_version,
            reason: body.reason,
          },
        },
      },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "学級申請の処理に失敗しました");
  }
}

// 申請者による取消。承認待ち以外は バックエンドが 422 を返す。
export async function DELETE(req: NextRequest, { params }: Params) {
  const { schoolClassRequestId } = await params;

  if (!isNumericId(schoolClassRequestId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  // 必要なキーだけ取り出して転送するため、オブジェクト以外(null・配列など)は弾く
  const body = await req.json().catch(() => undefined);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/teacher/school_class_requests/${schoolClassRequestId}`,
      {
        method: "DELETE",
        body: { reason: body.reason },
      },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "学級申請の取消に失敗しました");
  }
}
