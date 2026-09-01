import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchGoal } from "./useFetchGoal";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useFetchGoal", () => {
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

    const { result } = renderHook(() => useFetchGoal(1));

    await waitFor(() => expect(result.current.goal).toEqual(mockGoal));
    expect(result.current.fetchError).toBeNull();
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/goals/1");
  });

  it("404エラー時は「目標が見つかりませんでした」を設定する", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 404 },
    });

    const { result } = renderHook(() => useFetchGoal(1));

    await waitFor(() =>
      expect(result.current.fetchError).toBe("目標が見つかりませんでした"),
    );
  });

  it("404以外のエラー時は「目標の取得に失敗しました」を設定する", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useFetchGoal(1));

    await waitFor(() =>
      expect(result.current.fetchError).toBe("目標の取得に失敗しました"),
    );
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useFetchGoal(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("refetchで再取得しエラーがクリアされる", async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useFetchGoal(1));
    await waitFor(() =>
      expect(result.current.fetchError).toBe("目標の取得に失敗しました"),
    );

    const mockGoal = {
      id: 1,
      title: "英単語1000語を覚える",
      description: "",
      status: "in_progress",
      due_date: "2026-09-30",
      tasks: [],
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockGoal });

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.goal).toEqual(mockGoal));
    expect(result.current.fetchError).toBeNull();
  });
});
