import { apiFetch } from "@/libs/server/api";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const { response, data } = await apiFetch("/api/v1/user/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const nextResponse = NextResponse.json(data, { status: response.status });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

  return nextResponse;
}
