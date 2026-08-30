import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGetAnnouncements } from "./useGetAnnouncements";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useGetAnnouncements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("お知らせ一覧を取得しdataにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        announcements: [
          {
            id: 1,
            title: "お知らせ",
            content: "内容",
            publisher: { id: 1, name: "発行者", name_kana: "ハッコウシャ" },
            published_at: "2025-06-01T00:00:00.000Z",
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 1,
          total_count: 1,
          per_page: 20,
        },
      },
    });

    const { result } = renderHook(() => useGetAnnouncements());

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data?.announcements).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/announcements", {
      params: { page: "1" },
    });
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    const { result } = renderHook(() => useGetAnnouncements());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(result.current.error).toBeNull();
  });

  it("401以外のエラー時はerrorにセットする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useGetAnnouncements());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("setPageでpageを更新すると再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        announcements: [],
        meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 20 },
      },
    });

    const { result } = renderHook(() => useGetAnnouncements());

    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/student/announcements",
        { params: { page: "2" } },
      ),
    );
  });
});
