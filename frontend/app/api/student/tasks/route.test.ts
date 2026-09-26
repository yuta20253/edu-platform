import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { GET } from "./route";

vi.mock("@/libs/server/rails/railsFetch", () => ({
  railsFetch: vi.fn(),
}));

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/api/student/tasks${query}`));

describe("GET /api/student/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: { tasks: [] },
      setCookie: null,
    });
  });

  it("page のみのときは status を付けずに Rails へ転送する", async () => {
    await get("?page=2");
    expect(railsFetch).toHaveBeenCalledWith("/api/v1/student/tasks?page=2");
  });

  it("page 未指定のときは 1 ページ目として転送する", async () => {
    await get("");
    expect(railsFetch).toHaveBeenCalledWith("/api/v1/student/tasks?page=1");
  });

  it("status を Rails へ転送する", async () => {
    await get("?page=1&status=completed");
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/student/tasks?page=1&status=completed",
    );
  });

  it("Rails のレスポンスをそのまま返す", async () => {
    const res = await get("?page=1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ tasks: [] });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(new RailsUnauthorizedError());
    const res = await get("?page=1");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});
