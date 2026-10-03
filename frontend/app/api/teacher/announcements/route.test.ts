import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { railsFetch } from "@/libs/server/rails/railsFetch";
import { RailsUnauthorizedError } from "@/libs/server/rails/railsError";
import { POST } from "./route";

vi.mock("@/libs/server/rails/railsFetch", () => ({
  railsFetch: vi.fn(),
}));

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/teacher/announcements", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/teacher/announcements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(railsFetch).mockResolvedValue({
      status: 201,
      data: { message: "お知らせを下書きで作成しました。" },
      setCookie: null,
    });
  });

  it("リクエストボディを announcement キーでラップしてバックエンドへ転送する", async () => {
    const body = {
      title: "テスト",
      content: "本文",
      announcement_targets: [{ target_type: "all_users" }],
    };
    await post(body);
    expect(railsFetch).toHaveBeenCalledWith("/api/v1/teacher/announcements", {
      method: "POST",
      body: { announcement: body },
    });
  });

  it("バックエンドのレスポンスをそのまま返す", async () => {
    const res = await post({ title: "テスト", content: "本文" });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      message: "お知らせを下書きで作成しました。",
    });
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(railsFetch).mockRejectedValue(new RailsUnauthorizedError());
    const res = await post({ title: "テスト", content: "本文" });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});
