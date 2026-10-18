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

const url = (id: string, query = "") =>
  `http://localhost/api/student/interview-requests/${id}/messages${query}`;

const get = (interviewRequestId: string, query = "") =>
  GET(new NextRequest(url(interviewRequestId, query)), {
    params: Promise.resolve({ interviewRequestId }),
  });

const post = (interviewRequestId: string, body: string) =>
  POST(new NextRequest(url(interviewRequestId), { method: "POST", body }), {
    params: Promise.resolve({ interviewRequestId }),
  });

describe("GET /api/student/interview-requests/[interviewRequestId]/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { interview_request_messages: [], meta: {} },
      setCookie: null,
    });
  });

  it("page・per_page をバックエンドへ転送する", async () => {
    await get("1", "?page=2&per_page=100&foo=bar");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/student/interview_requests/1/messages?page=2&per_page=100",
    );
  });

  it("クエリが無いときは page=1 のみ転送する", async () => {
    await get("1");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/student/interview_requests/1/messages?page=1",
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await get("1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      interview_request_messages: [],
      meta: {},
    });
  });

  it("interviewRequestId が数値以外のときは BAD_REQUEST を返す", async () => {
    const res = await get("abc");
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());
    const res = await get("1");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/student/interview-requests/[interviewRequestId]/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 201,
      data: { id: 1, body: "よろしくお願いします" },
      setCookie: null,
    });
  });

  it("body を interview_request_message キーでラップしてバックエンドへ転送する", async () => {
    await post("1", JSON.stringify({ body: "よろしくお願いします" }));
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/student/interview_requests/1/messages",
      {
        method: "POST",
        body: { interview_request_message: { body: "よろしくお願いします" } },
      },
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await post(
      "1",
      JSON.stringify({ body: "よろしくお願いします" }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: 1, body: "よろしくお願いします" });
  });

  it("interviewRequestId が数値以外のときは BAD_REQUEST を返す", async () => {
    const res = await post("abc", JSON.stringify({ body: "a" }));
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("リクエストボディが不正なJSONのときは BAD_REQUEST を返しバックエンドへ転送しない", async () => {
    const res = await post("1", "{invalid");
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it.each(["null", "[]", "1"])(
    "リクエストボディがオブジェクト以外(%s)のときは BAD_REQUEST を返しバックエンドへ転送しない",
    async (body) => {
      const res = await post("1", body);
      expect(res.status).toBe(400);
      expect(backendFetch).not.toHaveBeenCalled();
    },
  );

  it("422 のときは バックエンドのエラー内容を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(
      new BackendFetchError(
        422,
        "Backend request failed: 422",
        JSON.stringify({ errors: ["本文を入力してください"] }),
      ),
    );
    const res = await post("1", JSON.stringify({ body: "" }));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ errors: ["本文を入力してください"] });
  });
});
