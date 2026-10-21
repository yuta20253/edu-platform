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
  GET(new NextRequest(`http://localhost/api/teacher/calendar${query}`));

const backendPath = (from: string, to: string) =>
  `/api/v1/teacher/interview_requests?from=${from}&to=${to}&per_page=100`;

describe("GET /api/teacher/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { interview_requests: [], meta: {} },
      setCookie: null,
    });
  });

  it("from・to を面談一覧APIへ転送し、1か月分をまとめて取得するため per_page=100 を付ける", async () => {
    await get("?from=2026-09-27&to=2026-10-31");
    expect(backendFetch).toHaveBeenCalledWith(
      backendPath("2026-09-27", "2026-10-31"),
    );
  });

  it("from・to 以外のクエリは転送しない", async () => {
    await get("?from=2026-09-27&to=2026-10-31&per_page=1&status=requested");
    expect(backendFetch).toHaveBeenCalledWith(
      backendPath("2026-09-27", "2026-10-31"),
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const data = {
      interview_requests: [
        { id: 1, scheduled_at: "2026-10-06T10:00:00+09:00" },
      ],
      meta: { current_page: 1, total_pages: 1, total_count: 1, per_page: 100 },
    };
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data,
      setCookie: "session=abc",
    });

    const res = await get("?from=2026-09-27&to=2026-10-31");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(data);
    expect(res.headers.get("set-cookie")).toBe("session=abc");
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());
    const res = await get("?from=2026-09-27&to=2026-10-31");
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
    const res = await get("?from=2026-10-31&to=2026-09-27");
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      errors: ["Toはfrom以降の日付を指定してください"],
    });
  });

  it.each([
    ["from が無い", "?to=2026-10-31"],
    ["to が無い", "?from=2026-09-27"],
    ["from が空文字", "?from=&to=2026-10-31"],
    ["from が YYYY-MM-DD 形式でない", "?from=2026/09/27&to=2026-10-31"],
    ["to が YYYY-MM-DD 形式でない", "?from=2026-09-27&to=20261031"],
    ["from に余計な文字が含まれる", "?from=2026-09-27x&to=2026-10-31"],
  ])("%s ときはバックエンドへ問い合わせず 400 を返す", async (_, query) => {
    const res = await get(query);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
    expect(backendFetch).not.toHaveBeenCalled();
  });
});
