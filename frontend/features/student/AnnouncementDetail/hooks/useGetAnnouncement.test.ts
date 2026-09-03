import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGetAnnouncement } from "./useGetAnnouncement";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useGetAnnouncement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("お知らせ詳細を取得しannouncementにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        id: 1,
        title: "お知らせ",
        content: "内容",
        publisher: { id: 1, name: "発行者", name_kana: "ハッコウシャ" },
        published_at: "2025-06-01T00:00:00.000Z",
      },
    });

    const { result } = renderHook(() => useGetAnnouncement(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.announcement?.title).toBe("お知らせ");
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/announcements/1");
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useGetAnnouncement(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("401以外のエラー時はerrorをtrueにしannouncementをnullにする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useGetAnnouncement(1));

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.announcement).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
