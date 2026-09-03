import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useStudents } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useStudents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("生徒一覧を取得しdataにセットする", async () => {
    const mockData = {
      students: [
        {
          id: 1,
          name: "山田太郎",
          name_kana: "ヤマダタロウ",
          grade: { display_name: "高校1年" },
        },
      ],
      meta: { current_page: 1, total_pages: 1, total_count: 1, per_page: 20 },
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useStudents());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/students", {
      params: { page: "1" },
    });
  });

  it("setPage で page が更新され、再取得時のパラメータに反映される", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        students: [],
        meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 20 },
      },
    });

    const { result } = renderHook(() => useStudents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => expect(result.current.page).toBe(2));
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/students", {
      params: { page: "2" },
    });
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    const { result } = renderHook(() => useStudents());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(result.current.loading).toBe(false);
  });
});
