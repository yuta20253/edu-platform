import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/libs/server/backend/fetch";
import {
  BackendFetchError,
  BackendUnauthorizedError,
} from "@/libs/server/backend/error";
import { GET } from "./route";

vi.mock("@/libs/server/backend/fetch", () => ({
  backendFetch: vi.fn(),
}));

const get = (teacherId: string) =>
  GET(new NextRequest(`http://localhost/api/teacher/permissions/${teacherId}`), {
    params: Promise.resolve({ teacherId }),
  });

describe("GET /api/teacher/permissions/[teacherId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: {
        id: 2,
        name: "鈴木花子",
        teacher_permission: {
          id: 2,
          grade_scope: "own_grade",
          manage_other_teachers: false,
          lock_version: 3,
        },
      },
      setCookie: null,
    });
  });

  it("バックエンドへ転送してレスポンスをそのまま返す", async () => {
    const res = await get("2");
    expect(backendFetch).toHaveBeenCalledWith("/api/v1/teacher/permissions/2");
    expect(res.status).toBe(200);
    expect((await res.json()).teacher_permission.lock_version).toBe(3);
  });

  it("teacherId が数値以外のときは BAD_REQUEST を返す", async () => {
    const res = await get("abc");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("404 のときはバックエンドのエラー内容を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(
      new BackendFetchError(
        404,
        "Backend request failed: 404",
        JSON.stringify({ message: "ユーザーが見つかりません" }),
      ),
    );
    const res = await get("999");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "ユーザーが見つかりません" });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());
    const res = await get("2");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});
