import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { useStudent } from "./hooks";
import type { StudentDetailTab } from "./types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const mockStudent = {
  id: 1,
  name: "山田太郎",
  name_kana: "ヤマダタロウ",
  email: "yamada@example.com",
  profile_completed: true,
  high_school: { name: "東京第一高校" },
  grade: { year: 1, display_name: "高校1年" },
};

const mockGoalsData = {
  student: { id: 1, name: "山田太郎" },
  goals: [],
};

const mockTasksData = {
  student: { id: 1, name: "山田太郎" },
  tasks: [],
  meta: { current_page: 2, total_pages: 2, total_count: 11, per_page: 10 },
};

describe("useStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("プロフィールタブではtabパラメータなしで取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockStudent });

    const { result } = renderHook(() => useStudent(1, "profile", 1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ tab: "profile", data: mockStudent });
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/students/1", {
      params: {},
      signal: expect.any(AbortSignal),
    });
  });

  it("目標タブではtab=goalsを付けて取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockGoalsData });

    const { result } = renderHook(() => useStudent(1, "goals", 1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ tab: "goals", data: mockGoalsData });
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/students/1", {
      params: { tab: "goals" },
      signal: expect.any(AbortSignal),
    });
  });

  it("タスクタブではtab=tasksとpageを付けて取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockTasksData });

    const { result } = renderHook(() => useStudent(1, "tasks", 2));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ tab: "tasks", data: mockTasksData });
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/students/1", {
      params: { tab: "tasks", page: "2" },
      signal: expect.any(AbortSignal),
    });
  });

  it("タブが変わるとそのタブのデータを取得し直す", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: mockStudent })
      .mockResolvedValueOnce({ data: mockGoalsData });

    const { result, rerender } = renderHook(
      ({ tab }: { tab: StudentDetailTab }) => useStudent(1, tab, 1),
      { initialProps: { tab: "profile" } },
    );

    await waitFor(() =>
      expect(result.current.data).toEqual({
        tab: "profile",
        data: mockStudent,
      }),
    );

    act(() => {
      rerender({ tab: "goals" });
    });

    await waitFor(() =>
      expect(result.current.data).toEqual({
        tab: "goals",
        data: mockGoalsData,
      }),
    );
    expect(apiClient.get).toHaveBeenLastCalledWith("/api/teacher/students/1", {
      params: { tab: "goals" },
      signal: expect.any(AbortSignal),
    });
  });

  it("キャンセルされた古いリクエストの結果で新しい結果を上書きしない", async () => {
    vi.mocked(apiClient.get).mockImplementation((_url, config) => {
      const tab = (config?.params as { tab?: string }).tab;
      if (tab === undefined) {
        // プロフィールの取得は遅延し、abortされるとキャンセルエラーで reject される
        return new Promise((_resolve, reject) => {
          config?.signal?.addEventListener?.("abort", () =>
            reject(new axios.CanceledError()),
          );
        });
      }
      return Promise.resolve({ data: mockGoalsData });
    });

    const { result, rerender } = renderHook(
      ({ tab }: { tab: StudentDetailTab }) => useStudent(1, tab, 1),
      { initialProps: { tab: "profile" } },
    );

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));
    const firstSignal = vi.mocked(apiClient.get).mock.calls[0][1]?.signal;

    act(() => {
      rerender({ tab: "goals" });
    });

    expect(firstSignal?.aborted).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ tab: "goals", data: mockGoalsData });
    expect(result.current.error).toBe(false);
  });

  it("401エラー時はログイン画面へリダイレクトし、エラー状態にはしない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    const { result } = renderHook(() => useStudent(1, "profile", 1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(false);
  });

  it("401以外のエラー時はerrorをtrueにしdataをnullのままにする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useStudent(1, "profile", 1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.data).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("タブ切り替え後に失敗したときはerrorをtrueにし、ヘッダー表示用に前回のデータを残す", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: mockStudent })
      .mockRejectedValueOnce({ response: { status: 500 } });

    const { result, rerender } = renderHook(
      ({ tab }: { tab: StudentDetailTab }) => useStudent(1, tab, 1),
      { initialProps: { tab: "profile" } },
    );

    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => {
      rerender({ tab: "tasks" });
    });

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ tab: "profile", data: mockStudent });
  });

  it("失敗したあとに取得し直すとerrorをfalseに戻す", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: mockGoalsData });

    const { result, rerender } = renderHook(
      ({ tab }: { tab: StudentDetailTab }) => useStudent(1, tab, 1),
      { initialProps: { tab: "profile" } },
    );

    await waitFor(() => expect(result.current.error).toBe(true));

    act(() => {
      rerender({ tab: "goals" });
    });

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.error).toBe(false);
  });
});
