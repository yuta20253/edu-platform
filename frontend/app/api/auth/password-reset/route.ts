import { apiFetch } from "@/libs/server/apiFetch";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const body = await req.json();
  const payload = body.password_reset;

  if (!payload) {
    return NextResponse.json(
      { errors: ["トークン、パスワードまたは確認用パスワードがありません"] },
      { status: 422 },
    );
  }

  const response = await apiFetch("/api/v1/password/reset", {
    method: "PATCH",
    body: JSON.stringify({
      password_reset: payload,
    }),
  });

  return NextResponse.json(response.data, {
    status: response.response.status,
  });
}
