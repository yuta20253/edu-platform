import { apiFetch } from "@/libs/server/api";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const role = body?.user?.user_role_name;

  if (!role) {
    return NextResponse.json(
      { errors: ["user_role_name is required"] },
      { status: 422 },
    );
  }

  const { response, data } = await apiFetch(`api/v1/${role}/signup`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return NextResponse.json(data, { status: response.status });
}
