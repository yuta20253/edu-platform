import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { useGetTasks } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useGetTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タスク一覧を取得しdataにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        tasks: [
          {
            id: 1,
            goal_id: 10,
            title: "英単語100個を覚える",
            content: "単語帳1〜100",
            due_date: "2026-09-01",
            priority: "high",
            status: "not_started",
            completed_at: "",
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 1,
          total_count: 1,
          per_page: 20,
        },
      },
    });

    const { result } = renderHook(() => useGetTasks());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.tasks).toHaveLength(1);
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/tasks", {
      params: { page: "1" },
      signal: expect.any(AbortSignal),
    });
  });

  it("ステータスを切り替えると status 付き・1ページ目で再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        tasks: [],
        meta: { current_page: 1, total_pages: 0, total_count: 0, per_page: 5 },
      },
    });

    const { result } = renderHook(() => useGetTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPage(3));
    await waitFor(() => expect(result.current.page).toBe(3));

    act(() => result.current.setStatus("completed"));

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith("/api/student/tasks", {
        params: { page: "1", status: "completed" },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(result.current.page).toBe(1);
    expect(result.current.status).toBe("completed");
  });

  it("絞り込みを切り替えると古いリクエストをキャンセルし、キャンセル結果でエラー表示にならない", async () => {
    const meta = {
      current_page: 1,
      total_pages: 1,
      total_count: 1,
      per_page: 5,
    };
    const signals: AbortSignal[] = [];

    vi.mocked(apiClient.get).mockImplementation((_url, config) => {
      const signal = config?.signal as AbortSignal;
      signals.push(signal);
      // 最初のリクエストは未解決のまま、abort されたら axios と同様にキャンセルで reject する
      if (signals.length === 1) {
        return new Promise((_, reject) => {
          signal.addEventListener("abort", () =>
            reject(new axios.CanceledError()),
          );
        });
      }
      return Promise.resolve({ data: { tasks: [], meta } });
    });

    const { result } = renderHook(() => useGetTasks());
    expect(signals[0].aborted).toBe(false);

    act(() => result.current.setStatus("completed"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.data?.tasks).toEqual([]);
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useGetTasks());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("401以外のエラー時はerrorをtrueにする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useGetTasks());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.data).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
