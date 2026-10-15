import { BackendUnauthorizedError } from "@/libs/server/backend/error";
import { backendFetch } from "@/libs/server/backend/fetch";
import { isNumericId } from "@/libs/server/routeParams";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;

  // courseId は数値IDのみ許容。不正値は バックエンドへ問い合わせる前に弾く
  if (!isNumericId(courseId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/courses/${courseId}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    if (error instanceof BackendUnauthorizedError) {
      return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
