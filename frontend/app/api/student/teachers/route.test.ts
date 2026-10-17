import { beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/libs/server/backend/fetch";
import { BackendUnauthorizedError } from "@/libs/server/backend/error";
import { GET } from "./route";

vi.mock("@/libs/server/backend/fetch", () => ({
  backendFetch: vi.fn(),
}));

describe("GET /api/student/teachers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { teachers: [{ id: 1, name: "担任先生" }] },
      setCookie: null,
    });
  });

  it("バックエンドへ転送してレスポンスをそのまま返す", async () => {
    const res = await GET();
    expect(backendFetch).toHaveBeenCalledWith("/api/v1/student/teachers");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      teachers: [{ id: 1, name: "担任先生" }],
    });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});
