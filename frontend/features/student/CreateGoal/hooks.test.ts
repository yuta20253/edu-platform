import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useSubmit } from "./hooks";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

describe("useSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("due_dateをyyyy-MM-dd形式に整形して送信し、作成後のgoalIdへ遷移する", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: 5 });
    const { result } = renderHook(() => useSubmit());

    await result.current.onSubmit(
      {
        title: "英単語1000語を覚える",
        description: "毎日30分学習する",
        due_date: new Date("2026-09-15T00:00:00.000Z"),
      },
      undefined as never,
    );

    expect(apiClient.post).toHaveBeenCalledWith("/api/student/goals", {
      goal: {
        title: "英単語1000語を覚える",
        description: "毎日30分学習する",
        due_date: "2026-09-15",
      },
    });
    expect(pushMock).toHaveBeenCalledWith("/goals/5/tasks/new");
  });

  it("due_dateがnullのときnullのまま送信する", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: 6 });
    const { result } = renderHook(() => useSubmit());

    await result.current.onSubmit(
      { title: "目標", description: "", due_date: null },
      undefined as never,
    );

    expect(apiClient.post).toHaveBeenCalledWith("/api/student/goals", {
      goal: { title: "目標", description: "", due_date: null },
    });
  });

  it("送信に失敗しても例外を投げない", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("network error"));
    const { result } = renderHook(() => useSubmit());

    await expect(
      result.current.onSubmit(
        { title: "目標", description: "", due_date: null },
        undefined as never,
      ),
    ).resolves.toBeUndefined();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
