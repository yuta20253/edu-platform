import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/libs/server/backend/fetch";
import { GET } from "./route";

vi.mock("@/libs/server/backend/fetch", () => ({
  backendFetch: vi.fn(),
}));

const get = (query: string) =>
  GET(
    new NextRequest(`http://localhost/api/admin/schools/5/teachers${query}`),
    { params: Promise.resolve({ schoolId: "5" }) },
  );

describe("GET /api/admin/schools/:schoolId/teachers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { teachers: [], meta: {} },
      setCookie: null,
    });
  });

  it("page を指定したときはバックエンドへ転送する", async () => {
    await get("?page=2");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/admin/high_schools/5/teachers?page=2",
    );
  });

  it("page 未指定のときは 1 ページ目として転送する", async () => {
    await get("");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/admin/high_schools/5/teachers?page=1",
    );
  });

  it("per_page を指定したときはバックエンドへ転送する", async () => {
    await get("?page=1&per_page=50");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/admin/high_schools/5/teachers?page=1&per_page=50",
    );
  });

  it("バックエンドの応答とステータスをそのまま返す", async () => {
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { teachers: [{ id: 1 }], meta: { current_page: 1 } },
      setCookie: null,
    });
    const res = await get("?page=1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      teachers: [{ id: 1 }],
      meta: { current_page: 1 },
    });
  });
});
