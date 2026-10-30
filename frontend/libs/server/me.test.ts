import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { getMeFromBackend, MeFetchError } from "./me";

const user = { id: 1, name: "生徒", user_role: { name: "student" } };

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status });

describe("getMeFromBackend", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("200 のとき user を返す", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { user }));

    await expect(getMeFromBackend("a=b")).resolves.toEqual(user);
  });

  it("401 のとき null を返す", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: "unauthorized" }));

    await expect(getMeFromBackend("a=b")).resolves.toBeNull();
  });

  it("通信に失敗したときは例外を投げる", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(getMeFromBackend("a=b")).rejects.toThrow("fetch failed");
  });

  it("500 のとき null ではなく MeFetchError を投げ、HTTP ステータスを持つ", async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, { error: "boom" }));

    const error = await getMeFromBackend("a=b").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(MeFetchError);
    expect((error as MeFetchError).status).toBe(500);
  });

  it("403・404 など 401 以外の失敗も MeFetchError を投げる", async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, {}));

    await expect(getMeFromBackend("a=b")).rejects.toBeInstanceOf(MeFetchError);
  });

  it("200 で JSON が壊れているとき MeFetchError を投げる", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 200 }));

    await expect(getMeFromBackend("a=b")).rejects.toBeInstanceOf(MeFetchError);
  });
});
