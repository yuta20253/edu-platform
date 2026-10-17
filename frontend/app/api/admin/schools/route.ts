import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = searchParams.get("page") ?? "1";
  const prefectureId = searchParams.get("prefecture_id");
  const perPage = searchParams.get("per_page");

  const params = new URLSearchParams({ page });
  if (prefectureId) params.set("prefecture_id", prefectureId);
  if (perPage) params.set("per_page", perPage);

  try {
    const { status, data, setCookie } = await railsFetch(
      `/api/v1/admin/high_schools?${params.toString()}`,
    );

    const res = NextResponse.json(data, { status });
    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch (error) {
    if (error instanceof RailsUnauthorizedError) {
      return NextResponse.json({ message: "UNAUTHORIZED" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
