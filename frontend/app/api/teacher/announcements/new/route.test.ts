import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { GET } from "./route";

vi.mock("@/libs/server/rails/railsFetch", () => ({
  railsFetch: vi.fn(),
}));

const get = (query = "") =>
  GET(new NextRequest(`http://localhost/api/teacher/announcements/new${query}`));

describe("GET /api/teacher/announcements/new", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: { grades: [], user_roles: [], students: { items: [], meta: {} } },
      setCookie: null,
    });
  });

  it("クエリパラメータが無いときはそのままバックエンドへ転送する", async () => {
    await get();
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/announcements/new",
    );
  });

  it("keyword をバックエンドへ転送する", async () => {
    await get("?keyword=yamada");
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/announcements/new?keyword=yamada",
    );
  });

  it("page をバックエンドへ転送する", async () => {
    await get("?page=2");
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/announcements/new?page=2",
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      grades: [],
      user_roles: [],
      students: { items: [], meta: {} },
    });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(new RailsUnauthorizedError());
    const res = await get();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});
