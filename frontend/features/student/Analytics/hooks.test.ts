import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useAnalytics } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const fetchCourseMock = vi.fn();
vi.mock("@/hooks/useCourses", () => ({
  useCourses: () => ({
    courses: null,
    fetchCourse: fetchCourseMock,
  }),
}));

describe("useAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初期状態ではtask_completionを取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { completed_count: 1, total_count: 2, completion_rate: 50 },
    });

    const { result } = renderHook(() => useAnalytics());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(apiClient.get).toHaveBeenCalledWith("/api/student/analytics", {
      params: { type: "task_completion" },
    });
    expect(result.current.data).toEqual({
      completed_count: 1,
      total_count: 2,
      completion_rate: 50,
    });
  });

  it("course_rankに切り替えるとcourseId未選択の間はAPIを呼ばない", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { completed_count: 0, total_count: 0, completion_rate: 0 },
    });
    const { result } = renderHook(() => useAnalytics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.mocked(apiClient.get).mockClear();

    act(() => {
      result.current.setType("course_rank");
    });

    expect(result.current.data).toBeNull();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("course_rankでcourseIdを選択するとAPIを呼ぶ", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { rank: 3, total_users: 30 },
    });
    const { result } = renderHook(() => useAnalytics());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setType("course_rank");
    });
    act(() => {
      result.current.setCourseId(5);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/analytics", {
      params: { type: "course_rank", course_id: "5" },
    });
    expect(result.current.data).toEqual({ rank: 3, total_users: 30 });
  });

  it("unit_rankはunitId未選択の間はAPIを呼ばない", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { completed_count: 0, total_count: 0, completion_rate: 0 },
    });
    const { result } = renderHook(() => useAnalytics());
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.mocked(apiClient.get).mockClear();

    act(() => {
      result.current.setType("unit_rank");
    });
    act(() => {
      result.current.setCourseId(5);
    });

    expect(result.current.data).toBeNull();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useAnalytics());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("取得に失敗するとerrorがtrueになりdataがnullになる", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.data).toBeNull();
  });
});
