import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import {
  RailsFetchError,
  RailsUnauthorizedError,
} from "@/libs/server/rails/railsError";
import { GET } from "./route";

vi.mock("@/libs/server/rails/railsFetch", () => ({
  railsFetch: vi.fn(),
}));

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/api/admin/analytics${query}`));

describe("GET /api/admin/analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: { kpis: {} },
      setCookie: null,
    });
  });

  it("クエリ未指定のときはパラメータなしでバックエンドへ転送する", async () => {
    await get("");
    expect(railsFetch).toHaveBeenCalledWith("/api/v1/admin/analytics?");
  });

  it("from / to / high_school_id / subject_id のみ転送する", async () => {
    await get(
      "?from=2026-09-01&to=2026-09-30&high_school_id=4&subject_id=2&evil=1&page=3",
    );
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/admin/analytics?from=2026-09-01&to=2026-09-30&high_school_id=4&subject_id=2",
    );
  });

  it("空文字のパラメータは転送しない", async () => {
    await get("?from=&to=2026-09-30&high_school_id=");
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/admin/analytics?to=2026-09-30",
    );
  });

  it("バックエンドのレスポンスとステータスをそのまま返す", async () => {
    const res = await get("");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ kpis: {} });
  });

  it("set-cookie があれば再送出する", async () => {
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: {},
      setCookie: "session=abc",
    });
    const res = await get("");
    expect(res.headers.get("set-cookie")).toBe("session=abc");
  });

  it("未認証のときは 401 を返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(new RailsUnauthorizedError());
    const res = await get("");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });

  it("期間不正(422)のときは Rails のエラー内容をそのまま返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(
      new RailsFetchError(
        422,
        "Unprocessable",
        JSON.stringify({ errors: ["指定できる期間は366日以内です"] }),
      ),
    );
    const res = await get("?from=2020-01-01&to=2026-01-01");
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      errors: ["指定できる期間は366日以内です"],
    });
  });
});
