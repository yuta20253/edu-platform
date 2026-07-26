import { apiFetch } from "@/libs/server/apiFetch";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const resetPasswordToken = body.reset_password_token;

  if (!resetPasswordToken) {
    return NextResponse.json(
      { errors: ["トークンがありません"] },
      { status: 422 },
    );
  }

  const response = await apiFetch("/api/v1/password/verify", {
    method: "POST",
    body: JSON.stringify({
      reset_password_token: resetPasswordToken,
    }),
  });

  return NextResponse.json(response.data, {
    status: response.response.status,
  });
}
