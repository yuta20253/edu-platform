import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/libs/server/backend/fetch";
import {
  BackendFetchError,
  BackendUnauthorizedError,
} from "@/libs/server/backend/error";
import { DELETE, GET, PATCH } from "./route";

vi.mock("@/libs/server/backend/fetch", () => ({
  backendFetch: vi.fn(),
}));

const url = (id: string) =>
  `http://localhost/api/teacher/interview-requests/${id}`;

const get = (interviewRequestId: string) =>
  GET(new NextRequest(url(interviewRequestId)), {
    params: Promise.resolve({ interviewRequestId }),
  });

const destroy = (interviewRequestId: string, body: string) =>
  DELETE(new NextRequest(url(interviewRequestId), { method: "DELETE", body }), {
    params: Promise.resolve({ interviewRequestId }),
  });

describe("GET /api/teacher/interview-requests/[interviewRequestId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { id: 1, status: "requested" },
      setCookie: null,
    });
  });

  it("バックエンドへ転送してレスポンスをそのまま返す", async () => {
    const res = await get("1");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/interview_requests/1",
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1, status: "requested" });
  });

  it("interviewRequestId が数値以外のときは BAD_REQUEST を返す", async () => {
    const res = await get("abc");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("404 のときは バックエンドのエラー内容を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(
      new BackendFetchError(
        404,
        "Backend request failed: 404",
        JSON.stringify({ message: "面談が見つかりません" }),
      ),
    );
    const res = await get("999");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "面談が見つかりません" });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());
    const res = await get("1");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});

const patch = (interviewRequestId: string, body: string) =>
  PATCH(new NextRequest(url(interviewRequestId), { method: "PATCH", body }), {
    params: Promise.resolve({ interviewRequestId }),
  });

describe("PATCH /api/teacher/interview-requests/[interviewRequestId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { message: "ステータスを更新しました" },
      setCookie: null,
    });
  });

  it("status・lock_version・scheduled_at のみを interview_request キーでラップして転送する", async () => {
    await patch(
      "1",
      JSON.stringify({
        status: "confirmed",
        lock_version: 2,
        scheduled_at: "2026-11-01T10:00:00+09:00",
        teacher_id: 9,
      }),
    );
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/interview_requests/1",
      {
        method: "PATCH",
        body: {
          interview_request: {
            status: "confirmed",
            lock_version: 2,
            scheduled_at: "2026-11-01T10:00:00+09:00",
          },
        },
      },
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await patch(
      "1",
      JSON.stringify({ status: "completed", lock_version: 0 }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "ステータスを更新しました" });
  });

  it("interviewRequestId が数値以外のときは BAD_REQUEST を返す", async () => {
    const res = await patch("abc", JSON.stringify({ lock_version: 0 }));
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it.each(["{invalid", "null", "[]", "1"])(
    "リクエストボディがオブジェクト以外(%s)のときは BAD_REQUEST を返しバックエンドへ転送しない",
    async (body) => {
      const res = await patch("1", body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
      expect(backendFetch).not.toHaveBeenCalled();
    },
  );

  it("409(楽観ロックの競合)のときは バックエンドのエラー内容をステータスごと返す", async () => {
    const errors = [
      "他のユーザーによってデータが更新されています。再読み込みしてください",
    ];
    vi.mocked(backendFetch).mockRejectedValue(
      new BackendFetchError(
        409,
        "Backend request failed: 409",
        JSON.stringify({ errors }),
      ),
    );
    const res = await patch(
      "1",
      JSON.stringify({ status: "completed", lock_version: 0 }),
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ errors });
  });
});

describe("DELETE /api/teacher/interview-requests/[interviewRequestId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { message: "面談をキャンセルしました" },
      setCookie: null,
    });
  });

  it("reason・lock_version のみをバックエンドへ転送する", async () => {
    await destroy(
      "1",
      JSON.stringify({ reason: "都合が悪くなった", lock_version: 2, foo: 1 }),
    );
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/interview_requests/1",
      {
        method: "DELETE",
        body: { reason: "都合が悪くなった", lock_version: 2 },
      },
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await destroy("1", JSON.stringify({ lock_version: 0 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "面談をキャンセルしました" });
  });

  it("interviewRequestId が数値以外のときは BAD_REQUEST を返す", async () => {
    const res = await destroy("abc", JSON.stringify({ lock_version: 0 }));
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("リクエストボディが不正なJSONのときは BAD_REQUEST を返しバックエンドへ転送しない", async () => {
    const res = await destroy("1", "{invalid");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it.each(["null", "[]", "1"])(
    "リクエストボディがオブジェクト以外(%s)のときは BAD_REQUEST を返しバックエンドへ転送しない",
    async (body) => {
      const res = await destroy("1", body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
      expect(backendFetch).not.toHaveBeenCalled();
    },
  );

  it("409(楽観ロックの競合)のときは バックエンドのエラー内容をステータスごと返す", async () => {
    const errors = [
      "他のユーザーによってデータが更新されています。再読み込みしてください",
    ];
    vi.mocked(backendFetch).mockRejectedValue(
      new BackendFetchError(
        409,
        "Backend request failed: 409",
        JSON.stringify({ errors }),
      ),
    );
    const res = await destroy("1", JSON.stringify({ lock_version: 0 }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ errors });
  });
});
