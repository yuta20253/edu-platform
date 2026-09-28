import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGetGoals, useDeleteGoal } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), delete: vi.fn() },
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
      data: {
        goals: [],
        meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 10 },
      },
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

describe("useDeleteGoal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("openDeleteDialogでdeleteTargetがセットされる", () => {
    const onDeleted = vi.fn();
    const { result } = renderHook(() => useDeleteGoal({ onDeleted }));

    act(() => {
      result.current.openDeleteDialog(1, "英単語1000語を覚える");
    });

    expect(result.current.deleteTarget).toEqual({
      id: 1,
      title: "英単語1000語を覚える",
    });
  });

  it("closeDeleteDialogでdeleteTargetがnullになる", () => {
    const onDeleted = vi.fn();
    const { result } = renderHook(() => useDeleteGoal({ onDeleted }));

    act(() => {
      result.current.openDeleteDialog(1, "目標");
    });
    act(() => {
      result.current.closeDeleteDialog();
    });

    expect(result.current.deleteTarget).toBeNull();
  });

  it("confirmDeleteでAPIを呼び成功するとonDeletedが呼ばれダイアログが閉じる", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});
    const onDeleted = vi.fn();
    const { result } = renderHook(() => useDeleteGoal({ onDeleted }));

    act(() => {
      result.current.openDeleteDialog(1, "目標");
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(apiClient.delete).toHaveBeenCalledWith("/api/student/goals/1");
    expect(onDeleted).toHaveBeenCalled();
    expect(result.current.deleteTarget).toBeNull();
  });

  it("confirmDeleteが失敗するとdeleteErrorがセットされる", async () => {
    vi.mocked(apiClient.delete).mockRejectedValue(new Error("failed"));
    const onDeleted = vi.fn();
    const { result } = renderHook(() => useDeleteGoal({ onDeleted }));

    act(() => {
      result.current.openDeleteDialog(1, "目標");
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(result.current.deleteError).toBe("目標の削除に失敗しました");
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("サーバーからエラーメッセージが返る場合はそれをdeleteErrorに使う", async () => {
    vi.mocked(apiClient.delete).mockRejectedValue({
      response: {
        status: 422,
        data: { errors: ["進行中または完了のタスクがあるため削除できません"] },
      },
    });
    const onDeleted = vi.fn();
    const { result } = renderHook(() => useDeleteGoal({ onDeleted }));

    act(() => {
      result.current.openDeleteDialog(1, "目標");
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(result.current.deleteError).toBe(
      "進行中または完了のタスクがあるため削除できません",
    );
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.delete).mockRejectedValue({
      response: { status: 401 },
    });
    const onDeleted = vi.fn();
    const { result } = renderHook(() => useDeleteGoal({ onDeleted }));

    act(() => {
      result.current.openDeleteDialog(1, "目標");
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
