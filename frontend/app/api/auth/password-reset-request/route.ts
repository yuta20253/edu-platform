import { apiFetch } from "@/libs/server/apiFetch";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();
    const email = body.email;

    if (!email) {
        return NextResponse.json(
            { errors: ["メールアドレスを入力してください"] },
            { status: 422 },
        );
    }

    const receivedRequest = await apiFetch(`/api/v1/password/reset/request`,{
        method: "POST",
        body: JSON.stringify({email}),
    });

    if (!receivedRequest.response.ok) {
        return NextResponse.json(receivedRequest.data, { status: receivedRequest.response.status });
    }

    return NextResponse.json(receivedRequest.data, { status: receivedRequest.response.status });
}