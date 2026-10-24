import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useStartStudyLog } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

describe("useStartStudyLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("study_logを作成し、study_log_id付きで問題一覧へ遷移する", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { study_log_id: 99 },
    });

    const { result } = renderHook(() =>
      useStartStudyLog({ taskId: 5, unitId: 11 }),
    );

    await act(async () => {
      await result.current.handleStart();
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/student/tasks/5/units/11/study_logs",
    );
    expect(pushMock).toHaveBeenCalledWith(
      "/tasks/5/units/11/questions?study_log_id=99",
    );
    expect(result.current.isStarting).toBe(false);
  });

  it("goalIdがあるとき遷移先パスはgoals配下になる", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { study_log_id: 99 },
    });

    const { result } = renderHook(() =>
      useStartStudyLog({ taskId: 5, unitId: 11, goalId: 3 }),
    );

    await act(async () => {
      await result.current.handleStart();
    });

    expect(pushMock).toHaveBeenCalledWith(
      "/goals/3/tasks/5/units/11/questions?study_log_id=99",
    );
  });

  it("study_logの作成に失敗してもstudy_log_idなしで問題一覧へ遷移する", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() =>
      useStartStudyLog({ taskId: 5, unitId: 11 }),
    );

    await act(async () => {
      await result.current.handleStart();
    });

    expect(pushMock).toHaveBeenCalledWith("/tasks/5/units/11/questions");
    expect(result.current.isStarting).toBe(false);
  });

  it("開始処理中に再度呼んでも二重に送信されない", async () => {
    let resolvePost: (value: {
      data: { study_log_id: number };
    }) => void = () => {};
    vi.mocked(apiClient.post).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useStartStudyLog({ taskId: 5, unitId: 11 }),
    );

    act(() => {
      result.current.handleStart();
    });
    expect(result.current.isStarting).toBe(true);

    act(() => {
      result.current.handleStart();
    });
    expect(apiClient.post).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePost({ data: { study_log_id: 99 } });
      await Promise.resolve();
    });
  });
});
