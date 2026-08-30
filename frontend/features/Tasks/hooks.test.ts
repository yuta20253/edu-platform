import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
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
    });
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
