import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGoal, useDeleteGoal } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), delete: vi.fn() },
}));

describe("useGoal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("目標を取得しgoalにセットする", async () => {
    const mockGoal = {
      id: 1,
      title: "英単語1000語を覚える",
      description: "毎日30分学習する",
      status: "in_progress",
      due_date: "2026-09-30",
      tasks: [],
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockGoal });

    const { result } = renderHook(() => useGoal(1));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.goal).toEqual(mockGoal);
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/goals/1");
  });

  it("取得に失敗するとerrorがtrueになりgoalがnullになる", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useGoal(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.goal).toBeNull();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useGoal(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});

describe("useDeleteGoal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("openDeleteDialogでdeleteDialogOpenがtrueになる", () => {
    const { result } = renderHook(() => useDeleteGoal({ goalId: 1 }));

    act(() => {
      result.current.openDeleteDialog();
    });

    expect(result.current.deleteDialogOpen).toBe(true);
  });

  it("closeDeleteDialogでdeleteDialogOpenがfalseになる", () => {
    const { result } = renderHook(() => useDeleteGoal({ goalId: 1 }));

    act(() => {
      result.current.openDeleteDialog();
    });
    act(() => {
      result.current.closeDeleteDialog();
    });

    expect(result.current.deleteDialogOpen).toBe(false);
  });

  it("confirmDeleteでAPIを呼び成功すると/goalsへ遷移する", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});
    const { result } = renderHook(() => useDeleteGoal({ goalId: 1 }));

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(apiClient.delete).toHaveBeenCalledWith("/api/student/goals/1");
    expect(pushMock).toHaveBeenCalledWith("/goals");
  });

  it("confirmDeleteが失敗するとdeleteErrorがセットされる", async () => {
    vi.mocked(apiClient.delete).mockRejectedValue(new Error("failed"));
    const { result } = renderHook(() => useDeleteGoal({ goalId: 1 }));

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(result.current.deleteError).toBe("目標の削除に失敗しました");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("サーバーからエラーメッセージが返る場合はそれをdeleteErrorに使う", async () => {
    vi.mocked(apiClient.delete).mockRejectedValue({
      response: {
        status: 422,
        data: { errors: ["進行中または完了のタスクがあるため削除できません"] },
      },
    });
    const { result } = renderHook(() => useDeleteGoal({ goalId: 1 }));

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(result.current.deleteError).toBe(
      "進行中または完了のタスクがあるため削除できません",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.delete).mockRejectedValue({
      response: { status: 401 },
    });
    const { result } = renderHook(() => useDeleteGoal({ goalId: 1 }));

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
