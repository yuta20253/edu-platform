import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ schoolId: string; courseId: string }> };

// コース割当の解除
export async function DELETE(_: NextRequest, { params }: Params) {
  const { schoolId, courseId } = await params;

  try {
    const { status, setCookie } = await railsFetch(
      `/api/v1/admin/high_schools/${schoolId}/course_assignments/${courseId}`,
      { method: "DELETE" },
    );

    const res = new NextResponse(null, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "コース割当の解除に失敗しました");
  }
}
