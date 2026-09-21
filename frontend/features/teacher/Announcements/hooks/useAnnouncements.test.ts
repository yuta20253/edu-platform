import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useAnnouncements } from "./useAnnouncements";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useAnnouncements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("受信タブではtabパラメータなしで取得する", async () => {
    const mockData = {
      announcements: [
        {
          id: 1,
          title: "お知らせ",
          content: "内容",
          publisher: { id: 1, name: "発行者", name_kana: "ハッコウシャ" },
          published_at: "2025-06-01T00:00:00.000Z",
        },
      ],
      meta: { current_page: 1, total_pages: 1, total_count: 1, per_page: 20 },
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useAnnouncements("received", 1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ tab: "received", data: mockData });
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/announcements", {
      params: { page: "1" },
    });
  });

  it("作成分タブではtab=authoredを付与して取得する", async () => {
    const mockData = {
      announcements: [
        {
          id: 2,
          title: "下書き",
          content: "内容",
          status: "draft",
          published_at: null,
          scheduled_at: null,
        },
      ],
      meta: { current_page: 1, total_pages: 1, total_count: 1, per_page: 20 },
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useAnnouncements("authored", 1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ tab: "authored", data: mockData });
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/announcements", {
      params: { page: "1", tab: "authored" },
    });
  });

  it("pageが変わると再取得時のパラメータに反映される", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        announcements: [],
        meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 20 },
      },
    });

    const { rerender } = renderHook(
      ({ page }) => useAnnouncements("received", page),
      { initialProps: { page: 1 } },
    );

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/announcements", {
        params: { page: "1" },
      }),
    );

    act(() => {
      rerender({ page: 2 });
    });

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/teacher/announcements",
        { params: { page: "2" } },
      ),
    );
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useAnnouncements("received", 1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
