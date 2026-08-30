import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useSubmit } from "./useSubmit";
import type { EditTaskForm } from "../types";

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
  });

  const formData: EditTaskForm = {
    title: "英単語100個を覚える",
    content: "単語帳1〜100",
    priority: "high",
    due_date: new Date("2026-09-01"),
    unit_ids: null,
  };

  it("due_dateをフォーマットしunit_idsを含めてPATCHし、成功トーストを表示する", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });

    const { result } = renderHook(() =>
      useSubmit({ goalId: undefined, taskId: 1, selectedUnitIds: [11, 12] }),
    );

    await act(async () => {
      await result.current.onSubmit(formData);
    });

    expect(apiClient.patch).toHaveBeenCalledWith("/api/student/tasks/1", {
      task: {
        title: "英単語100個を覚える",
        content: "単語帳1〜100",
        priority: "high",
        due_date: "2026-09-01",
        unit_ids: [11, 12],
      },
    });
    expect(result.current.toast).toEqual({
      open: true,
      message: "タスクを更新しました",
      severity: "success",
    });
  });

  it("due_dateがnullのときnullとして送信する", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });

    const { result } = renderHook(() =>
      useSubmit({ goalId: undefined, taskId: 1, selectedUnitIds: [] }),
    );

    await act(async () => {
      await result.current.onSubmit({ ...formData, due_date: null });
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      "/api/student/tasks/1",
      expect.objectContaining({
        task: expect.objectContaining({ due_date: null }),
      }),
    );
  });

  it("PATCHが失敗するとエラートーストを表示する", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue(new Error("failed"));

    const { result } = renderHook(() =>
      useSubmit({ goalId: undefined, taskId: 1, selectedUnitIds: [] }),
    );

    await act(async () => {
      await result.current.onSubmit(formData);
    });

    expect(result.current.toast).toEqual({
      open: true,
      message: "タスクの更新に失敗しました",
      severity: "error",
    });
  });

  it("closeToastでtoast.openがfalseになる", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });

    const { result } = renderHook(() =>
      useSubmit({ goalId: undefined, taskId: 1, selectedUnitIds: [] }),
    );

    await act(async () => {
      await result.current.onSubmit(formData);
    });
    expect(result.current.toast.open).toBe(true);

    act(() => {
      result.current.closeToast();
    });

    await waitFor(() => expect(result.current.toast.open).toBe(false));
  });
});
