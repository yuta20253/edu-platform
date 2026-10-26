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
    new NextRequest(
      `http://localhost/api/teacher/school-class-requests${query}`,
    ),
  );

const post = (body: string) =>
  POST(
    new NextRequest("http://localhost/api/teacher/school-class-requests", {
      method: "POST",
      body,
    }),
  );

describe("GET /api/teacher/school-class-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { school_class_requests: [], meta: {} },
      setCookie: null,
    });
  });

  it("page・status をバックエンドへ転送する", async () => {
    await get("?page=2&status=pending");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/school_class_requests?page=2&status=pending",
    );
  });

  it("status が無いときは page のみ転送する", async () => {
    await get("");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/school_class_requests?page=1",
    );
  });

  it("定義外の status や他のクエリは転送しない", async () => {
    await get("?status=unknown&applicant_id=2");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/school_class_requests?page=1",
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await get("");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ school_class_requests: [], meta: {} });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());
    const res = await get("");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});

describe("POST /api/teacher/school-class-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 201,
      data: { message: "学級作成申請を受け付けました" },
      setCookie: null,
    });
  });

  it("action・grade_id・name・school_class_id だけを school_class_request キーでラップしてバックエンドへ転送する", async () => {
    await post(
      JSON.stringify({
        action: "modification",
        grade_id: 1,
        name: "1年B組",
        school_class_id: 3,
        applicant_id: 99,
      }),
    );
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/school_class_requests",
      {
        method: "POST",
        body: {
          school_class_request: {
            action: "modification",
            grade_id: 1,
            name: "1年B組",
            school_class_id: 3,
          },
        },
      },
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await post(
      JSON.stringify({ action: "creation", grade_id: 1, name: "1年D組" }),
    );
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      message: "学級作成申請を受け付けました",
    });
  });

  it.each(["{invalid", "null", "[]", "1"])(
    "リクエストボディがオブジェクト以外(%s)のときは BAD_REQUEST を返しバックエンドへ転送しない",
    async (body) => {
      const res = await post(body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
      expect(backendFetch).not.toHaveBeenCalled();
    },
  );

  it("422 のときは バックエンドのエラー内容を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(
      new BackendFetchError(
        422,
        "Backend request failed: 422",
        JSON.stringify({
          errors: [
            "School classは生徒または教員が所属しているため削除できません",
          ],
        }),
      ),
    );
    const res = await post(
      JSON.stringify({ action: "deletion", grade_id: 1, school_class_id: 3 }),
    );
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      errors: ["School classは生徒または教員が所属しているため削除できません"],
    });
  });
});
