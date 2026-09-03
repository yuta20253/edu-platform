import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchAnnouncements } from "./useFetchAnnouncements";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useFetchAnnouncements", () => {
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
            status: "published",
            published_at: "2026-01-01T00:00:00.000Z",
            scheduled_at: null,
            created_at: "2026-01-01T00:00:00.000Z",
          },
        ],
        meta: { current_page: 1, total_pages: 1, total_count: 1, per_page: 20 },
      },
    });

    const { result } = renderHook(() => useFetchAnnouncements(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.announcements).toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/admin/schools/1/announcements",
      { params: { page: "1" } },
    );
  });

  it("ページを変更すると再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        announcements: [],
        meta: {
          current_page: 1,
          total_pages: 2,
          total_count: 30,
          per_page: 20,
        },
      },
    });

    const { result } = renderHook(() => useFetchAnnouncements(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/admin/schools/1/announcements",
        { params: { page: "2" } },
      ),
    );
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useFetchAnnouncements(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
