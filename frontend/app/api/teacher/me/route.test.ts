import { beforeEach, describe, expect, it, vi } from "vitest";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { GET } from "./route";

vi.mock("@/libs/server/rails/railsFetch", () => ({
  railsFetch: vi.fn(),
}));

describe("GET /api/teacher/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("/api/v1/meへ転送する", async () => {
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: { user: { id: 1 } },
      setCookie: null,
    });

    await GET();

    expect(railsFetch).toHaveBeenCalledWith("/api/v1/me");
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: { user: { id: 1, name: "山田太郎" } },
      setCookie: null,
    });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: { id: 1, name: "山田太郎" } });
  });

  it("401のときはUNAUTHORIZEDを返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(new RailsUnauthorizedError());

    const res = await GET();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });

  it("想定外のエラー時は500を返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(new Error("network error"));

    const res = await GET();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "INTERNAL_SERVER_ERROR" });
  });
});
