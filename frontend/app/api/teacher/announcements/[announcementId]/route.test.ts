import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/libs/server/backend/backendFetch";
import { BackendUnauthorizedError } from "@/libs/server/backend/backendError";
import { PATCH } from "./route";

vi.mock("@/libs/server/backend/backendFetch", () => ({
  backendFetch: vi.fn(),
}));

const patch = (announcementId: string, body: unknown) =>
  PATCH(
    new NextRequest(
      `http://localhost/api/teacher/announcements/${announcementId}`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),
    { params: Promise.resolve({ announcementId }) },
  );

describe("PATCH /api/teacher/announcements/[announcementId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: { message: "お知らせのステータスを更新しました。" },
      setCookie: null,
    });
  });

  it("リクエストボディを announcement キーでラップしてバックエンドへ転送する", async () => {
    const body = { status: "published" };
    await patch("1", body);
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/announcements/1",
      {
        method: "PATCH",
        body: { announcement: body },
      },
    );
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await patch("1", { status: "published" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      message: "お知らせのステータスを更新しました。",
    });
  });

  it("announcementId が数値以外のときは BAD_REQUEST を返す", async () => {
    const res = await patch("abc", { status: "published" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("リクエストボディが不正なJSONのときは BAD_REQUEST を返しバックエンドへ転送しない", async () => {
    const res = await PATCH(
      new NextRequest("http://localhost/api/teacher/announcements/1", {
        method: "PATCH",
        body: "{invalid",
      }),
      { params: Promise.resolve({ announcementId: "1" }) },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());
    const res = await patch("1", { status: "published" });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});
