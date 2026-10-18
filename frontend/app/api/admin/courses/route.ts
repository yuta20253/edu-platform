import { BackendUnauthorizedError } from "@/libs/server/backend/error";
import { backendFetch } from "@/libs/server/backend/fetch";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = searchParams.get("page") ?? "1";
  const perPage = searchParams.get("per_page");
  const q = searchParams.get("q");
  const sort = searchParams.get("sort");
  const order = searchParams.get("order");

  const params = new URLSearchParams({ page });
  if (perPage) params.set("per_page", perPage);
  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  if (order) params.set("order", order);

  try {
    const { status, data, setCookie } = await backendFetch(
      `/api/v1/admin/courses?${params.toString()}`,
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
