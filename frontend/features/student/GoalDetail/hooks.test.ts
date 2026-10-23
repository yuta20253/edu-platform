import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useDeleteGoal } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), delete: vi.fn() },
}));

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
