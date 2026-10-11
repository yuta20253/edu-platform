import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import {
  RailsFetchError,
  RailsUnauthorizedError,
} from "@/libs/server/rails/railsError";
import { DELETE, GET } from "./route";

vi.mock("@/libs/server/rails/railsFetch", () => ({
  railsFetch: vi.fn(),
}));

const url = (id: string) =>
  `http://localhost/api/student/interview-requests/${id}`;

const get = (interviewRequestId: string) =>
  GET(new NextRequest(url(interviewRequestId)), {
    params: Promise.resolve({ interviewRequestId }),
  });

const destroy = (interviewRequestId: string, body: string) =>
  DELETE(new NextRequest(url(interviewRequestId), { method: "DELETE", body }), {
    params: Promise.resolve({ interviewRequestId }),
  });

describe("GET /api/student/interview-requests/[interviewRequestId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: { id: 1, status: "requested" },
      setCookie: null,
    });
  });

  it("バックエンドへ転送してレスポンスをそのまま返す", async () => {
    const res = await get("1");
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/student/interview_requests/1",
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1, status: "requested" });
  });

  it("interviewRequestId が数値以外のときは BAD_REQUEST を返す", async () => {
    const res = await get("abc");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
    expect(railsFetch).not.toHaveBeenCalled();
  });

  it("404 のときは Rails のエラー内容を返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(
      new RailsFetchError(
        404,
        "Rails request failed: 404",
        JSON.stringify({ message: "面談が見つかりません" }),
      ),
    );
    const res = await get("999");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "面談が見つかりません" });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(new RailsUnauthorizedError());
    const res = await get("1");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});

describe("DELETE /api/student/interview-requests/[interviewRequestId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(railsFetch).mockResolvedValue({
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
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/student/interview_requests/1",
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
    expect(railsFetch).not.toHaveBeenCalled();
  });

  it("リクエストボディが不正なJSONのときは BAD_REQUEST を返しバックエンドへ転送しない", async () => {
    const res = await destroy("1", "{invalid");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
    expect(railsFetch).not.toHaveBeenCalled();
  });

  it.each(["null", "[]", "1"])(
    "リクエストボディがオブジェクト以外(%s)のときは BAD_REQUEST を返しバックエンドへ転送しない",
    async (body) => {
      const res = await destroy("1", body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
      expect(railsFetch).not.toHaveBeenCalled();
    },
  );

  it("409(楽観ロックの競合)のときは Rails のエラー内容をステータスごと返す", async () => {
    const errors = [
      "他のユーザーによってデータが更新されています。再読み込みしてください",
    ];
    vi.mocked(railsFetch).mockRejectedValue(
      new RailsFetchError(
        409,
        "Rails request failed: 409",
        JSON.stringify({ errors }),
      ),
    );
    const res = await destroy("1", JSON.stringify({ lock_version: 0 }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ errors });
  });
});
