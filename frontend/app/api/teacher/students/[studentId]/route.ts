import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const { studentId } = await params;
  const tab = req.nextUrl.searchParams.get("tab");

  const query = new URLSearchParams();
  if (tab) query.set("tab", tab);
  const queryString = query.toString();

  try {
    const { data, status, setCookie } = await railsFetch(
      `/api/v1/teacher/students/${studentId}${queryString ? `?${queryString}` : ""}`,
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
