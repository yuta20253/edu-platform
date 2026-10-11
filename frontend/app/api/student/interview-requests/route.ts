import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { isInterviewStatus } from "@/libs/domain/interview/interviewRequest";
import { type NextRequest, NextResponse } from "next/server";

// 定義外の status は Rails へ渡さず全件扱いにする
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") ?? "1";
  const status = searchParams.get("status") ?? "";

  const params = new URLSearchParams({ page });
  if (isInterviewStatus(status)) params.set("status", status);

  try {
    const {
      status: resStatus,
      data,
      setCookie,
    } = await railsFetch(
      `/api/v1/student/interview_requests?${params.toString()}`,
    );

    const res = NextResponse.json(data, { status: resStatus });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "面談の取得に失敗しました");
  }
}

// Railsはparams.require(:interview_request)を要求するため、リクエストボディをinterview_requestキーでラップしてforwardする。
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => undefined);
  if (body === undefined) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await railsFetch(
      "/api/v1/student/interview_requests",
      { method: "POST", body: { interview_request: body } },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "面談の申請に失敗しました");
  }
}
