import { apiFetch } from "@/libs/server/apiFetch";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";

  const { response, data } = await apiFetch("/api/v1/user/logout", {
    method: "DELETE",
    headers: { Cookie: cookie },
  });

  const nextResponse = NextResponse.json(data, { status: response.status });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

  return nextResponse;
}
