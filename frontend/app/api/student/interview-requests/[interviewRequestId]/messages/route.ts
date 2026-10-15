import { backendFetch } from "@/libs/server/backend/backendFetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleBackendRouteError";
import { isNumericId } from "@/libs/server/routeParams";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ interviewRequestId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { interviewRequestId } = await params;

  if (!isNumericId(interviewRequestId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  const { searchParams } = req.nextUrl;
  const query = new URLSearchParams({ page: searchParams.get("page") ?? "1" });
  const perPage = searchParams.get("per_page");
  if (perPage) query.set("per_page", perPage);

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/student/interview_requests/${interviewRequestId}/messages?${query.toString()}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "メッセージの取得に失敗しました");
  }
}

// バックエンドはparams.require(:interview_request_message)を要求するため、bodyをラップしてforwardする。
export async function POST(req: NextRequest, { params }: Params) {
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
      `/api/v1/student/interview_requests/${interviewRequestId}/messages`,
      {
        method: "POST",
        body: { interview_request_message: { body: body.body } },
      },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "メッセージの送信に失敗しました");
  }
}
