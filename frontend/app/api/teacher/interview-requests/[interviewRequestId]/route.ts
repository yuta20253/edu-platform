import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { isNumericId } from "@/libs/server/routeParams";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ interviewRequestId: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { interviewRequestId } = await params;

  if (!isNumericId(interviewRequestId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/teacher/interview_requests/${interviewRequestId}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "面談の取得に失敗しました");
  }
}

// 面談の日程確定・完了。楽観ロックのため lock_version を必ず送る(競合時は バックエンドが 409 を返す)。
// バックエンドはparams.require(:interview_request)を要求するため、必要なキーだけをラップしてforwardする。
export async function PATCH(req: NextRequest, { params }: Params) {
  const { interviewRequestId } = await params;

  if (!isNumericId(interviewRequestId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  // 必要なキーだけ取り出して転送するため、オブジェクト以外(null・配列など)は弾く
  const body = await req.json().catch(() => undefined);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/teacher/interview_requests/${interviewRequestId}`,
      {
        method: "PATCH",
        body: {
          interview_request: {
            status: body.status,
            lock_version: body.lock_version,
            scheduled_at: body.scheduled_at,
          },
        },
      },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "面談の更新に失敗しました");
  }
}

// 面談のキャンセル(却下を含む)。楽観ロックのため lock_version を必ず送る(競合時は バックエンドが 409 を返す)。
export async function DELETE(req: NextRequest, { params }: Params) {
  const { interviewRequestId } = await params;

  if (!isNumericId(interviewRequestId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  // 必要なキーだけ取り出して転送するため、オブジェクト以外(null・配列など)は弾く
  const body = await req.json().catch(() => undefined);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/teacher/interview_requests/${interviewRequestId}`,
      {
        method: "DELETE",
        body: { reason: body.reason, lock_version: body.lock_version },
      },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "面談のキャンセルに失敗しました");
  }
}
