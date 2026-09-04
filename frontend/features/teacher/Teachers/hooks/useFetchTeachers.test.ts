import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchTeachers } from "./useFetchTeachers";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useFetchTeachers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("教員一覧を取得しdataにセットする", async () => {
    const teachersData = {
      current_user: { id: 1 },
      teachers: [{ id: 2, name: "山田太郎" }],
      meta: { current_page: 1, total_pages: 1, total_count: 1, per_page: 10 },
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: teachersData });

    const { result } = renderHook(() => useFetchTeachers());

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data).toEqual(teachersData);
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/teachers", {
      params: { page: "1" },
    });
  });

  it("setPage でページ番号に応じたparamsで再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        current_user: { id: 1 },
        teachers: [],
        meta: { current_page: 2, total_pages: 2, total_count: 1, per_page: 10 },
      },
    });

    const { result } = renderHook(() => useFetchTeachers());
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/teachers", {
        params: { page: "2" },
      }),
    );
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useFetchTeachers());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
