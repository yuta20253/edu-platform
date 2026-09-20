import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "task_completion";
  const courseId = searchParams.get("course_id");
  const unitId = searchParams.get("unit_id");

  const params = new URLSearchParams({ "analytics[type]": type });
  if (courseId) params.set("course_id", courseId);
  if (unitId) params.set("unit_id", unitId);

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/student/analytics?${params.toString()}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "分析画面への遷移に失敗しました");
  }
}
