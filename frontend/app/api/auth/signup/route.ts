import { apiFetch } from "@/libs/server/apiFetch";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const role = body?.user?.user_role_name;
  const email = body.user.email;
  const password = body.user.password;

  if (!role) {
    return NextResponse.json(
      { errors: ["user_role_name is required"] },
      { status: 422 },
    );
  }
  if (!email || !password) {
    return NextResponse.json(
      { errors: ["email/password is required"] },
      { status: 422 },
    );
  }

  const signup = await apiFetch(`api/v1/${role}/signup`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!signup.response.ok) {
    return NextResponse.json(signup.data, { status: signup.response.status });
  }

  // 登録成功したらログイン(Cookie発行)
  const login = await apiFetch("/api/v1/user/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const nextResponse = NextResponse.json(login.data, {
    status: login.response.status,
  });

  // ログインで返ってきた Set-Cookie をブラウザへ中継
  const setCookie = login.response.headers.get("set-cookie");
  if (setCookie) nextResponse.headers.set("set-cookie", setCookie);

  return nextResponse;
}
