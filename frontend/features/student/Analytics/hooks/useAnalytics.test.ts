import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useAnalytics } from "./useAnalytics";

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

describe("useAnalytics(順位)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { rank: 3, total_users: 30 },
    });
  });

  it("初期状態はコース内順位で、コース未選択の間はAPIを呼ばない", () => {
    const { result } = renderHook(() => useAnalytics());

    expect(result.current.type).toBe("course_rank");
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("コースを選択するとコース内順位を取得する", async () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.setCourseId(5);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/analytics", {
      params: { type: "course_rank", course_id: "5" },
      signal: expect.any(AbortSignal),
    });
    expect(result.current.data).toEqual({ rank: 3, total_users: 30 });
  });

  it("教科を選択するとその教科のコースを取得し、コース・単元の選択を戻す", () => {
    const { result } = renderHook(() => useAnalytics());
    act(() => {
      result.current.setCourseId(5);
    });

    act(() => {
      result.current.setSubject("数学");
    });

    expect(fetchCourseMock).toHaveBeenCalledWith("数学");
    expect(result.current.courseId).toBeNull();
    expect(result.current.unitId).toBeNull();
  });

  it("単元内順位は単元を選択するまでAPIを呼ばない", () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.setType("unit_rank");
    });
    act(() => {
      result.current.setCourseId(5);
    });

    expect(result.current.data).toBeNull();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("単元内順位で単元を選択すると単元内順位を取得する", async () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.setType("unit_rank");
    });
    act(() => {
      result.current.setCourseId(5);
    });
    act(() => {
      result.current.setUnitId(10);
    });

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/analytics", {
      params: { type: "unit_rank", course_id: "5", unit_id: "10" },
      signal: expect.any(AbortSignal),
    });
  });

  it("順位の種類を切り替えても選択中の教科・コースは残す", () => {
    const { result } = renderHook(() => useAnalytics());
    act(() => {
      result.current.setSubject("数学");
    });
    act(() => {
      result.current.setCourseId(5);
    });

    act(() => {
      result.current.setType("unit_rank");
    });

    expect(result.current.subject).toBe("数学");
    expect(result.current.courseId).toBe(5);
    expect(result.current.unitId).toBeNull();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.setCourseId(5);
    });

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("取得に失敗するとerrorがtrueになりdataがnullになる", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error("network error"));
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.setCourseId(5);
    });

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });
});
