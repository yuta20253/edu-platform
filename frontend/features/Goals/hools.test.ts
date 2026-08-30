import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGetGoals } from "./hools";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useGetGoals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("目標一覧を取得しdataにセットする", async () => {
    const mockData = {
      goals: [
        {
          id: 1,
          title: "英単語1000語を覚える",
          status: "in_progress",
          due_date: "2026-09-30",
          tasks: [],
        },
      ],
      meta: { current_page: 1, total_pages: 1, total_count: 1, per_page: 10 },
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useGetGoals());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/goals", {
      params: { page: "1" },
    });
  });

  it("取得に失敗するとerrorがtrueになりdataがnullになる", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useGetGoals());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useGetGoals());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("setPageでpageを更新すると再取得される", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { goals: [], meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 10 } },
    });

    const { result } = renderHook(() => useGetGoals());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith("/api/student/goals", {
        params: { page: "2" },
      }),
    );
    expect(result.current.page).toBe(2);
  });
});
