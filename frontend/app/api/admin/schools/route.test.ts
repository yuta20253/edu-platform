import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { GET } from "./route";

vi.mock("@/libs/server/rails/railsFetch", () => ({
  railsFetch: vi.fn(),
}));

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/api/admin/schools${query}`));

describe("GET /api/admin/schools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: { schools: [] },
      setCookie: null,
    });
  });

  it("page 未指定のときは 1 ページ目として転送する", async () => {
    await get("");
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/admin/high_schools?page=1",
    );
  });

  it("prefecture_id をバックエンドへ転送する", async () => {
    await get("?page=2&prefecture_id=13");
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/admin/high_schools?page=2&prefecture_id=13",
    );
  });

  it("per_page をバックエンドへ転送する", async () => {
    await get("?page=1&per_page=100");
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/admin/high_schools?page=1&per_page=100",
    );
  });
});
