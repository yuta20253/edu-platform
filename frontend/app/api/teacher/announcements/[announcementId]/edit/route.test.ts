import { beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/libs/server/backend/fetch";
import { BackendUnauthorizedError } from "@/libs/server/backend/error";
import { GET } from "./route";

vi.mock("@/libs/server/backend/fetch", () => ({
  backendFetch: vi.fn(),
}));

const get = (announcementId: string) =>
  GET(
    new Request(
      `http://localhost/api/teacher/announcements/${announcementId}/edit`,
    ),
    { params: Promise.resolve({ announcementId }) },
  );

const editData = {
  announcement: {
    id: 1,
    title: "下書き",
    content: "本文",
    status: "draft",
    scheduled_at: null,
  },
  announcement_targets: [],
};

describe("GET /api/teacher/announcements/[announcementId]/edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendFetch).mockResolvedValue({
      status: 200,
      data: editData,
      setCookie: null,
    });
  });

  it("バックエンドのeditアクションへ転送する", async () => {
    await get("1");
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/teacher/announcements/1/edit",
    );
  });

  it("バックエンドのレスポンスをステータスごとそのまま返す", async () => {
    vi.mocked(backendFetch).mockResolvedValue({
      status: 403,
      data: { message: "FORBIDDEN" },
      setCookie: null,
    });
    const res = await get("1");
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "FORBIDDEN" });
  });

  it("announcementId が数値以外のときは BAD_REQUEST を返しバックエンドへ転送しない", async () => {
    const res = await get("abc");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "BAD_REQUEST" });
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("401 のときは UNAUTHORIZED を返す", async () => {
    vi.mocked(backendFetch).mockRejectedValue(new BackendUnauthorizedError());
    const res = await get("1");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "UNAUTHORIZED" });
  });
});
