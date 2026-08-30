import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchDraftTask } from "./useFetchDraftTask";

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useFetchDraftTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("draftTaskIdがnullのとき取得しない", () => {
    const { result } = renderHook(() => useFetchDraftTask(null));
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(result.current.draftTask).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("draftTaskを取得しisLoadingがfalseに戻る", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        id: 1,
        goal_id: 9,
        title: "英単語100個を覚える",
        content: "単語帳1〜100",
        priority: "high",
        due_date: "2026-09-01",
        units: [],
      },
    });

    const { result } = renderHook(() => useFetchDraftTask(1));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.draftTask?.title).toBe("英単語100個を覚える");
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/student/draft-tasks/1",
    );
  });

  it("取得に失敗してもisLoadingはfalseに戻り、draftTaskはnullのまま", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("failed"));

    const { result } = renderHook(() => useFetchDraftTask(1));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.draftTask).toBeNull();
  });
});
