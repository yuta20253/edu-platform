import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchTask } from "./useFetchTask";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useFetchTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タスクを取得しtaskにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        id: 1,
        goal_id: 10,
        title: "英単語100個を覚える",
        content: "単語帳1〜100",
        due_date: "2026-09-01",
        priority: "high",
        status: "not_started",
        completed_at: "",
      },
    });

    const { result } = renderHook(() => useFetchTask(1));

    await waitFor(() => expect(result.current.task).not.toBeNull());
    expect(result.current.task?.title).toBe("英単語100個を覚える");
    expect(result.current.fetchError).toBeNull();
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/tasks/1");
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useFetchTask(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("404エラー時は「タスクが見つかりませんでした」を設定する", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 404 },
    });

    const { result } = renderHook(() => useFetchTask(1));

    await waitFor(() =>
      expect(result.current.fetchError).toBe("タスクが見つかりませんでした"),
    );
  });

  it("その他のエラー時は「タスクの取得に失敗しました」を設定する", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useFetchTask(1));

    await waitFor(() =>
      expect(result.current.fetchError).toBe("タスクの取得に失敗しました"),
    );
  });

  it("refetchを呼ぶと再度取得しfetchErrorがリセットされる", async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useFetchTask(1));

    await waitFor(() =>
      expect(result.current.fetchError).toBe("タスクの取得に失敗しました"),
    );

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        id: 1,
        goal_id: 10,
        title: "英単語100個を覚える",
        content: "",
        due_date: "2026-09-01",
        priority: "high",
        status: "not_started",
        completed_at: "",
      },
    });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() =>
      expect(result.current.task?.title).toBe("英単語100個を覚える"),
    );
    expect(result.current.fetchError).toBeNull();
  });
});
