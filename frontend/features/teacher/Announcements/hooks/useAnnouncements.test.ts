import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import axios from "axios";
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
      signal: expect.any(AbortSignal),
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
      signal: expect.any(AbortSignal),
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
        signal: expect.any(AbortSignal),
      }),
    );

    act(() => {
      rerender({ page: 2 });
    });

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/teacher/announcements",
        { params: { page: "2" }, signal: expect.any(AbortSignal) },
      ),
    );
  });

  it("再取得時に前回のリクエストをabortする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        announcements: [],
        meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 20 },
      },
    });

    const { result, rerender } = renderHook(
      ({ page }) => useAnnouncements("received", page),
      { initialProps: { page: 1 } },
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));
    const firstSignal = vi.mocked(apiClient.get).mock.calls[0][1]?.signal;
    expect(firstSignal?.aborted).toBe(false);

    act(() => {
      rerender({ page: 2 });
    });

    expect(firstSignal?.aborted).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("キャンセルされた古いリクエストの結果で新しい結果を上書きしない", async () => {
    const page2Data = {
      announcements: [],
      meta: { current_page: 2, total_pages: 2, total_count: 0, per_page: 20 },
    };
    vi.mocked(apiClient.get).mockImplementation((_url, config) => {
      const page = (config?.params as { page: string }).page;
      if (page === "1") {
        // page=1 は遅延し、abortされるとキャンセルエラーで reject される
        return new Promise((_resolve, reject) => {
          config?.signal?.addEventListener?.("abort", () =>
            reject(new axios.CanceledError()),
          );
        });
      }
      return Promise.resolve({ data: page2Data });
    });

    const { result, rerender } = renderHook(
      ({ page }) => useAnnouncements("received", page),
      { initialProps: { page: 1 } },
    );

    act(() => {
      rerender({ page: 2 });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ tab: "received", data: page2Data });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useAnnouncements("received", 1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
