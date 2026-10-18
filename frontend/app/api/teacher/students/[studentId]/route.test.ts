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

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/api/teacher/students/1${query}`), {
    params: Promise.resolve({ studentId: "1" }),
  });

describe("GET /api/teacher/students/:studentId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { id: 1, name: "山田太郎" },
      setCookie: null,
    });
  });

  it("tab 未指定のときはクエリを付けずにバックエンドへ転送する", async () => {
    await get("");
    expect(backendFetch).toHaveBeenCalledWith("/api/v1/teacher/students/1");
  });

  it("tab を指定したときはバックエンドへ転送する", async () => {
    await get("?tab=goals");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/students/1?tab=goals",
    );
  });

  it("tasks タブの page をバックエンドへ転送する", async () => {
    await get("?tab=tasks&page=2");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/students/1?tab=tasks&page=2",
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await get("");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 1, name: "山田太郎" });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());
    const res = await get("");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });

  it("401 以外のバックエンドのエラーはステータスを保って返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(
      new BackendFetchError(
        404,
        "Backend request failed: 404",
        JSON.stringify({ errors: ["Not Found"] }),
      ),
    );
    const res = await get("?tab=goals");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ errors: ["Not Found"] });
  });
});
