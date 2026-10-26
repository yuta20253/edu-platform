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
  `http://localhost/api/teacher/school-class-requests/${id}`;

const get = (schoolClassRequestId: string) =>
  GET(new NextRequest(url(schoolClassRequestId)), {
    params: Promise.resolve({ schoolClassRequestId }),
  });

const patch = (schoolClassRequestId: string, body: string) =>
  PATCH(
    new NextRequest(url(schoolClassRequestId), { method: "PATCH", body }),
    { params: Promise.resolve({ schoolClassRequestId }) },
  );

const destroy = (schoolClassRequestId: string, body: string) =>
  DELETE(
    new NextRequest(url(schoolClassRequestId), { method: "DELETE", body }),
    { params: Promise.resolve({ schoolClassRequestId }) },
  );

const conflictErrors = [
  "この申請はすでに処理されています。再読み込みしてください",
];

describe("GET /api/teacher/school-class-requests/[schoolClassRequestId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { id: 1, status: "pending" },
      setCookie: null,
    });
  });

  it("バックエンドへ転送してレスポンスをそのまま返す", async () => {
    const res = await get("1");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/school_class_requests/1",
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1, status: "pending" });
  });

  it("schoolClassRequestId が数値以外のときは BAD_REQUEST を返す", async () => {
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
        JSON.stringify({ message: "見つかりません" }),
      ),
    );
    const res = await get("999");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "見つかりません" });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());
    const res = await get("1");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});

describe("PATCH /api/teacher/school-class-requests/[schoolClassRequestId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { message: "申請が却下されました" },
      setCookie: null,
    });
  });

  it("status・lock_version・reason のみを school_class_request キーでラップして転送する", async () => {
    await patch(
      "1",
      JSON.stringify({
        status: "rejected",
        lock_version: 2,
        reason: "クラス数の上限を超えるため",
        approver_id: 9,
      }),
    );
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/school_class_requests/1",
      {
        method: "PATCH",
        body: {
          school_class_request: {
            status: "rejected",
            lock_version: 2,
            reason: "クラス数の上限を超えるため",
          },
        },
      },
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await patch(
      "1",
      JSON.stringify({ status: "rejected", lock_version: 0 }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "申請が却下されました" });
  });

  it("schoolClassRequestId が数値以外のときは BAD_REQUEST を返す", async () => {
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

  it("409(他の教員が先に処理した)のときは バックエンドのエラー内容をステータスごと返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(
      new BackendFetchError(
        409,
        "Backend request failed: 409",
        JSON.stringify({ errors: conflictErrors }),
      ),
    );
    const res = await patch(
      "1",
      JSON.stringify({ status: "approved", lock_version: 0 }),
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ errors: conflictErrors });
  });
});

describe("DELETE /api/teacher/school-class-requests/[schoolClassRequestId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { message: "申請を取り消しました" },
      setCookie: null,
    });
  });

  it("reason のみをバックエンドへ転送する", async () => {
    await destroy(
      "1",
      JSON.stringify({ reason: "学年会で見送りになった", lock_version: 2 }),
    );
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/school_class_requests/1",
      {
        method: "DELETE",
        body: { reason: "学年会で見送りになった" },
      },
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await destroy("1", JSON.stringify({}));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "申請を取り消しました" });
  });

  it("schoolClassRequestId が数値以外のときは BAD_REQUEST を返す", async () => {
    const res = await destroy("abc", JSON.stringify({}));
    expect(res.status).toBe(400);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it.each(["{invalid", "null", "[]", "1"])(
    "リクエストボディがオブジェクト以外(%s)のときは BAD_REQUEST を返しバックエンドへ転送しない",
    async (body) => {
      const res = await destroy("1", body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
      expect(backendFetch).not.toHaveBeenCalled();
    },
  );

  it("422(承認待ち以外)のときは バックエンドのエラー内容をステータスごと返す", async () => {
    const errors = ["承認待ちの申請のみ取り消せます"];
    vi.mocked(backendFetch).mockRejectedValue(
      new BackendFetchError(
        422,
        "Backend request failed: 422",
        JSON.stringify({ errors }),
      ),
    );
    const res = await destroy("1", JSON.stringify({}));
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ errors });
  });
});
