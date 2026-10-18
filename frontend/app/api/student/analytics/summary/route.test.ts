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
  GET(new NextRequest(`http://localhost/api/student/analytics/summary${query}`));

describe("GET /api/student/analytics/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: {},
      setCookie: null,
    });
  });

  it("from・to をバックエンドへ転送する", async () => {
    await get("?from=2026-10-12&to=2026-10-18");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/student/analytics/summary?from=2026-10-12&to=2026-10-18",
    );
  });

  it("from・to が無いときはクエリを付けずに転送する(期間はバックエンドの既定値になる)", async () => {
    await get("");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/student/analytics/summary",
    );
  });

  it("from・to 以外のクエリは転送しない", async () => {
    await get("?from=2026-10-12&to=2026-10-18&user_id=2");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/student/analytics/summary?from=2026-10-12&to=2026-10-18",
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const summary = { streak_days: 3 };
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: summary,
      setCookie: "session=abc",
    });

    const res = await get("?from=2026-10-12&to=2026-10-18");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(summary);
    expect(res.headers.get("set-cookie")).toBe("session=abc");
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());
    const res = await get("?from=2026-10-12&to=2026-10-18");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });

  it("422 のときはバックエンドのエラー内容をそのまま返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(
      new BackendFetchError(
        422,
        "Unprocessable",
        JSON.stringify({ errors: ["Toはfrom以降の日付を指定してください"] }),
      ),
    );
    const res = await get("?from=2026-10-18&to=2026-10-12");
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      errors: ["Toはfrom以降の日付を指定してください"],
    });
  });
});
