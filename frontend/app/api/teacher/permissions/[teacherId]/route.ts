import { backendFetch } from "@/libs/server/backend/fetch";
import { handleBackendRouteError } from "@/libs/server/backend/handleRouteError";
import { isNumericId } from "@/libs/server/routeParams";
import { type NextRequest, NextResponse } from "next/server";

// 編集ドロワーを開くときに、その時点の最新の権限と lock_version を取り直す
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> },
) {
  const { teacherId } = await params;

  if (!isNumericId(teacherId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/teacher/permissions/${teacherId}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "権限の取得に失敗しました");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> },
) {
  const { teacherId } = await params;

  if (!isNumericId(teacherId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  const body = await request.json();

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/teacher/permissions/${teacherId}`,
      { method: "PATCH", body },
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleBackendRouteError(error, "権限の更新に失敗しました");
  }
}
