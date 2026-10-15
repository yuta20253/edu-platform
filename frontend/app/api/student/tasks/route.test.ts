import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/libs/server/backend/backendFetch";
import { BackendUnauthorizedError } from "@/libs/server/backend/backendError";
import { GET } from "./route";

vi.mock("@/libs/server/backend/backendFetch", () => ({
  backendFetch: vi.fn(),
}));

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/api/student/tasks${query}`));

describe("GET /api/student/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { tasks: [] },
      setCookie: null,
    });
  });

  it("page のみのときは status を付けずにバックエンドへ転送する", async () => {
    await get("?page=2");
    expect(backendFetch).toHaveBeenCalledWith("/api/v1/student/tasks?page=2");
  });

  it("page 未指定のときは 1 ページ目として転送する", async () => {
    await get("");
    expect(backendFetch).toHaveBeenCalledWith("/api/v1/student/tasks?page=1");
  });

  it("status をバックエンドへ転送する", async () => {
    await get("?page=1&status=completed");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/student/tasks?page=1&status=completed",
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await get("?page=1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ tasks: [] });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());
    const res = await get("?page=1");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});
