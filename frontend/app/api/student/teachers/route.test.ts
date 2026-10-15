import { beforeEach, describe, expect, it, vi } from "vitest";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { GET } from "./route";

vi.mock("@/libs/server/rails/railsFetch", () => ({
  railsFetch: vi.fn(),
}));

describe("GET /api/student/teachers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: { teachers: [{ id: 1, name: "担任先生" }] },
      setCookie: null,
    });
  });

  it("バックエンドへ転送してレスポンスをそのまま返す", async () => {
    const res = await GET();
    expect(railsFetch).toHaveBeenCalledWith("/api/v1/student/teachers");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      teachers: [{ id: 1, name: "担任先生" }],
    });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(new RailsUnauthorizedError());
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});
