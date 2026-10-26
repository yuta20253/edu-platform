import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { isSchoolClassRequestStatus } from "@/libs/domain/schoolClassRequest/schoolClassRequestStatus";
import { type NextRequest, NextResponse } from "next/server";

// 定義外の status は バックエンドへ渡さず全件扱いにする
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = searchParams.get("page") ?? "1";
  const status = searchParams.get("status") ?? "";

  const params = new URLSearchParams({ page });
  if (isSchoolClassRequestStatus(status)) params.set("status", status);

  try {
    const {
      status: resStatus,
      data,
      setCookie,
    } = await backendFetch(
      `/api/v1/teacher/school_class_requests?${params.toString()}`,
    );

    const res = NextResponse.json(data, { status: resStatus });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "学級申請の取得に失敗しました");
  }
}

// バックエンドはparams.require(:school_class_request)を要求するため、必要なキーだけをラップしてforwardする。
export async function POST(req: NextRequest) {
  // 必要なキーだけ取り出して転送するため、オブジェクト以外(null・配列など)は弾く
  const body = await req.json().catch(() => undefined);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      "/api/v1/teacher/school_class_requests",
      {
        method: "POST",
        body: {
          school_class_request: {
            action: body.action,
            grade_id: body.grade_id,
            name: body.name,
            school_class_id: body.school_class_id,
          },
        },
      },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "学級申請の作成に失敗しました");
  }
}
