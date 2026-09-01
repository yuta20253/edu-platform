import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { railsFetchMultipart } from "@/libs/server/rails/railsFetchMultipart";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ courseId: string; unitId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { courseId, unitId } = await params;

  if (!/^\d+$/.test(courseId) || !/^\d+$/.test(unitId)) {
    return NextResponse.json({ message: "BAD_REQUEST" }, { status: 400 });
  }

  const formData = await request.formData();

  try {
    const { status, data, setCookie } = await railsFetchMultipart(
      `/api/v1/admin/courses/${courseId}/units/${unitId}/import_questions/dry_run`,
      formData,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    return handleRailsRouteError(error, "CSVの検証に失敗しました");
  }
}
