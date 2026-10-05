import { railsFetch } from "@/libs/server/rails/railsFetch";
import { handleRailsRouteError } from "@/libs/server/rails/handleRailsRouteError";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { status, data, setCookie } = await railsFetch(
      "/api/v1/student/account_link",
      {
        method: "POST",
        body,
      },
    );

    const res = NextResponse.json(data, { status });

    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (error) {
    return handleRailsRouteError(error, "アカウントの紐付けに失敗しました");
  }
}
