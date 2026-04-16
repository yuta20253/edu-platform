import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { status, data, setCookie } = await railsFetch(
      "/api/v1/teacher/dashboard",
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
