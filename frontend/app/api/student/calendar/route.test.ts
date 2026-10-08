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
  GET(new NextRequest(`http://localhost/api/student/calendar${query}`));

describe("GET /api/student/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: [],
      setCookie: null,
    });
  });

  it("from・to をバックエンドへ転送する", async () => {
    await get("?from=2026-09-27&to=2026-11-07");
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/student/calendar?from=2026-09-27&to=2026-11-07",
    );
  });

  it("from・to 以外のクエリは転送しない", async () => {
    await get("?from=2026-09-27&to=2026-11-07&user_id=2");
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/student/calendar?from=2026-09-27&to=2026-11-07",
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const events = [
      {
        type: "goal",
        id: 1,
        date: "2026/10/10",
        title: "目標",
        status: "in_progress",
      },
    ];
    vi.mocked(railsFetch).mockResolvedValue({
      status: 200,
      data: events,
      setCookie: "session=abc",
    });

    const res = await get("?from=2026-09-27&to=2026-11-07");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(events);
    expect(res.headers.get("set-cookie")).toBe("session=abc");
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(new RailsUnauthorizedError());
    const res = await get("?from=2026-09-27&to=2026-11-07");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });

  it("422 のときはバックエンドのエラー内容をそのまま返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(
      new RailsFetchError(
        422,
        "Unprocessable",
        JSON.stringify({ errors: ["Toはfrom以降の日付を指定してください"] }),
      ),
    );
    const res = await get("?from=2026-11-07&to=2026-09-27");
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      errors: ["Toはfrom以降の日付を指定してください"],
    });
  });

  it.each([
    ["from が無い", "?to=2026-11-07"],
    ["to が無い", "?from=2026-09-27"],
    ["from が空文字", "?from=&to=2026-11-07"],
    ["from が YYYY-MM-DD 形式でない", "?from=2026/09/27&to=2026-11-07"],
    ["to が YYYY-MM-DD 形式でない", "?from=2026-09-27&to=20261107"],
    ["from に余計な文字が含まれる", "?from=2026-09-27x&to=2026-11-07"],
  ])("%s ときはバックエンドへ問い合わせず 400 を返す", async (_, query) => {
    const res = await get(query);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
    expect(railsFetch).not.toHaveBeenCalled();
  });

  it("形式が正しければ実在しない日付でもバックエンドへ転送する(日付の妥当性は Rails で判定する)", async () => {
    await get("?from=2026-02-30&to=2026-03-31");
    expect(railsFetch).toHaveBeenCalledWith(
      "/api/v1/student/calendar?from=2026-02-30&to=2026-03-31",
    );
  });
});
