import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGetTask } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useGetTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タスク詳細を取得しtaskにセットする", async () => {
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

    const { result } = renderHook(() => useGetTask(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.task?.title).toBe("英単語100個を覚える");
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/tasks/1");
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      message: "Unauthorized",
      response: { status: 401 },
    });

    renderHook(() => useGetTask(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("401以外のエラー時はerrorをtrueにする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      message: "Server Error",
      response: { status: 500 },
    });

    const { result } = renderHook(() => useGetTask(1));

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.task).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
