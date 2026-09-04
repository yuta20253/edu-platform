import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGetUnit, useStartStudyLog } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

describe("useGetUnit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("単元データを取得しunitにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        id: 11,
        course_id: 1,
        unit_name: "二次関数",
        course: { id: 1, level_number: 1, level_name: "標準" },
      },
    });

    const { result } = renderHook(() => useGetUnit({ taskId: 5, unitId: 11 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(false);
    expect(result.current.unit?.unit_name).toBe("二次関数");
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/tasks/5/units/11");
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useGetUnit({ taskId: 5, unitId: 11 }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("401以外のエラー時はerrorがtrueになりunitはnullのまま", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useGetUnit({ taskId: 5, unitId: 11 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.unit).toBeNull();
  });
});

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
