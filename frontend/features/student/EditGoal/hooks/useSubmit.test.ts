import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useSubmit } from "./useSubmit";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { patch: vi.fn() },
}));

describe("useSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("due_dateをyyyy-MM-dd形式に整形して更新し、成功トーストを表示して1秒後に遷移する", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useSubmit({ goalId: 1 }));

    await act(async () => {
      await result.current.onSubmit(
        {
          title: "英単語1000語を覚える",
          description: "毎日30分学習する",
          due_date: new Date("2026-09-15T00:00:00.000Z"),
        },
        undefined as never,
      );
    });

    expect(apiClient.patch).toHaveBeenCalledWith("/api/student/goals/1", {
      goal: {
        title: "英単語1000語を覚える",
        description: "毎日30分学習する",
        due_date: "2026-09-15",
      },
    });
    expect(result.current.toast).toEqual({
      open: true,
      message: "目標を更新しました",
      severity: "success",
    });
    expect(pushMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(pushMock).toHaveBeenCalledWith("/goals/1");
  });

  it("due_dateがnullのときnullのまま送信する", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useSubmit({ goalId: 1 }));

    await act(async () => {
      await result.current.onSubmit(
        { title: "目標", description: "", due_date: null },
        undefined as never,
      );
    });

    expect(apiClient.patch).toHaveBeenCalledWith("/api/student/goals/1", {
      goal: { title: "目標", description: "", due_date: null },
    });
  });

  it("更新に失敗するとエラートーストを表示し遷移しない", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue(new Error("network error"));
    const { result } = renderHook(() => useSubmit({ goalId: 1 }));

    await act(async () => {
      await result.current.onSubmit(
        { title: "目標", description: "", due_date: null },
        undefined as never,
      );
    });

    expect(result.current.toast).toEqual({
      open: true,
      message: "目標の更新に失敗しました",
      severity: "error",
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("closeToastでtoast.openがfalseになる", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useSubmit({ goalId: 1 }));

    await act(async () => {
      await result.current.onSubmit(
        { title: "目標", description: "", due_date: null },
        undefined as never,
      );
    });
    expect(result.current.toast.open).toBe(true);

    act(() => {
      result.current.closeToast();
    });
    expect(result.current.toast.open).toBe(false);
  });
});
