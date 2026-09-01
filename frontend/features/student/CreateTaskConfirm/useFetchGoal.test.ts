import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchGoal } from "./useFetchGoal";

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useFetchGoal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("goalIdが0のとき取得しない", () => {
    const { result } = renderHook(() => useFetchGoal(0));
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.goal).toBeNull();
  });

  it("goalを取得しgoalにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        title: "英語の基礎を固める",
        description: "文法を復習する",
        due_date: "2026-12-01",
      },
    });

    const { result } = renderHook(() => useFetchGoal(9));

    await waitFor(() =>
      expect(result.current.goal?.title).toBe("英語の基礎を固める"),
    );
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/goals/9");
  });

  it("取得に失敗してもgoalはnullのまま", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("failed"));

    const { result } = renderHook(() => useFetchGoal(9));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    expect(result.current.goal).toBeNull();
  });
});
