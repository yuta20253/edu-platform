import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGoal } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useGoal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("目標を取得しgoalにセットする", async () => {
    const mockGoal = {
      id: 1,
      title: "英単語1000語を覚える",
      description: "毎日30分学習する",
      status: "in_progress",
      due_date: "2026-09-30",
      tasks: [],
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockGoal });

    const { result } = renderHook(() => useGoal(1));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.goal).toEqual(mockGoal);
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/goals/1");
  });

  it("取得に失敗するとerrorがtrueになりgoalがnullになる", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useGoal(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.goal).toBeNull();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useGoal(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
