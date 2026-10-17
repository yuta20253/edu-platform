import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/libs/server/backend/fetch";
import {
  BackendFetchError,
  BackendUnauthorizedError,
} from "@/libs/server/backend/error";
import { GET, POST } from "./route";

vi.mock("@/libs/server/backend/fetch", () => ({
  backendFetch: vi.fn(),
}));

const get = (query: string) =>
  GET(
    new NextRequest(`http://localhost/api/student/interview-requests${query}`),
  );

const post = (body: string) =>
  POST(
    new NextRequest("http://localhost/api/student/interview-requests", {
      method: "POST",
      body,
    }),
  );

describe("GET /api/student/interview-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { interview_requests: [], meta: {} },
      setCookie: null,
    });
  });

  it("page・status をバックエンドへ転送する", async () => {
    await get("?page=2&status=requested");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/student/interview_requests?page=2&status=requested",
    );
  });

  it("status が無いときは page のみ転送する", async () => {
    await get("");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/student/interview_requests?page=1",
    );
  });

  it("定義外の status や他のクエリは転送しない", async () => {
    await get("?status=unknown&student_id=2");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/student/interview_requests?page=1",
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await get("");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ interview_requests: [], meta: {} });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());
    const res = await get("");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});

describe("POST /api/student/interview-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 201,
      data: { message: "面談を申請しました" },
      setCookie: null,
    });
  });

  it("リクエストボディを interview_request キーでラップしてバックエンドへ転送する", async () => {
    const body = {
      teacher_id: 1,
      reason_category: "career",
      reason_detail: "進路の相談",
    };
    await post(JSON.stringify(body));
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/student/interview_requests",
      { method: "POST", body: { interview_request: body } },
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await post(JSON.stringify({ teacher_id: 1 }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ message: "面談を申請しました" });
  });

  it("リクエストボディが不正なJSONのときは BAD_REQUEST を返しバックエンドへ転送しない", async () => {
    const res = await post("{invalid");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("422 のときは バックエンドのエラー内容を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(
      new BackendFetchError(
        422,
        "Backend request failed: 422",
        JSON.stringify({ errors: ["申請可能な教員ではありません"] }),
      ),
    );
    const res = await post(JSON.stringify({ teacher_id: 999 }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      errors: ["申請可能な教員ではありません"],
    });
  });
});
