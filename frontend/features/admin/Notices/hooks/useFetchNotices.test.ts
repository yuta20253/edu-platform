import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchNotices } from "./useFetchNotices";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const emptyResponse = {
  data: {
    announcements: [],
    meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 20 },
  },
};

describe("useFetchNotices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("お知らせ一覧を取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        announcements: [
          {
            id: 1,
            title: "テストお知らせ",
            status: "draft",
            target_type: "all_users",
            published_at: null,
            scheduled_at: null,
            created_at: "2026-01-01T00:00:00.000Z",
            publisher: {
              id: 1,
              name: "管理者太郎",
              name_kana: "カンリシャタロウ",
            },
          },
        ],
        meta: { current_page: 1, total_pages: 1, total_count: 1, per_page: 20 },
      },
    });

    const { result } = renderHook(() => useFetchNotices());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.announcements).toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/announcements", {
      params: { page: "1" },
      signal: expect.any(AbortSignal),
    });
  });

  it("ページを変更すると再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);

    const { result } = renderHook(() => useFetchNotices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/admin/announcements",
        { params: { page: "2" }, signal: expect.any(AbortSignal) },
      ),
    );
  });

  it("検索文字列を入力するとqパラメータ付きで再取得し、ページが1に戻る", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);

    const { result } = renderHook(() => useFetchNotices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(2);
    });
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => {
      result.current.onQueryChange("メンテナンス");
    });

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/admin/announcements",
        {
          params: { page: "1", q: "メンテナンス" },
          signal: expect.any(AbortSignal),
        },
      ),
    );
    expect(result.current.page).toBe(1);
  });

  it("ステータスを変更するとstatusパラメータ付きで再取得し、ページが1に戻る", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);

    const { result } = renderHook(() => useFetchNotices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(2);
    });
    await waitFor(() => expect(result.current.page).toBe(2));

    act(() => {
      result.current.onStatusChange("published");
    });

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/admin/announcements",
        {
          params: { page: "1", status: "published" },
          signal: expect.any(AbortSignal),
        },
      ),
    );
    expect(result.current.page).toBe(1);
  });

  it("ページ変更前の古いリクエストはキャンセルされる", async () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const { result, unmount } = renderHook(() => useFetchNotices());

    const firstSignal = (
      vi.mocked(apiClient.get).mock.calls[0][1] as { signal?: AbortSignal }
    )?.signal;

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
    expect(firstSignal?.aborted).toBe(true);

    unmount();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useFetchNotices());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("401以外のエラー時はerrorがtrueになる", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useFetchNotices());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("再取得に成功するとerrorがfalseに戻る", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce(emptyResponse);

    const { result } = renderHook(() => useFetchNotices());
    await waitFor(() => expect(result.current.error).toBe(true));

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => expect(result.current.error).toBe(false));
  });
});
