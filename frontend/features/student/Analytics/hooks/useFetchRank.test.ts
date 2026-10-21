import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchRank } from "./useFetchRank";

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

describe("useFetchRank(順位)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { rank: 3, total_users: 30 },
    });
  });

  it("初期状態はコース内順位で、コース未選択の間はAPIを呼ばない", () => {
    const { result } = renderHook(() => useFetchRank());

    expect(result.current.type).toBe("course_rank");
    expect(result.current.selected).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("コースを選択するとコース内順位を取得する", async () => {
    const { result } = renderHook(() => useFetchRank());

    act(() => {
      result.current.setCourseId(5);
    });

    expect(result.current.selected).toBe(true);
    await waitFor(() =>
      expect(result.current.data).toEqual({ rank: 3, total_users: 30 }),
    );
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/analytics", {
      params: { type: "course_rank", course_id: "5" },
      signal: expect.any(AbortSignal),
    });
  });

  it("教科を選択するとその教科のコースを取得し、コース・単元の選択を戻す", () => {
    const { result } = renderHook(() => useFetchRank());
    act(() => {
      result.current.setCourseId(5);
    });

    act(() => {
      result.current.setSubject("数学");
    });

    expect(fetchCourseMock).toHaveBeenCalledWith("数学");
    expect(result.current.courseId).toBeNull();
    expect(result.current.unitId).toBeNull();
    expect(result.current.selected).toBe(false);
  });

  it("単元内順位は単元を選択するまでAPIを呼ばない", () => {
    const { result } = renderHook(() => useFetchRank());

    act(() => {
      result.current.setType("unit_rank");
    });
    act(() => {
      result.current.setCourseId(5);
    });

    expect(result.current.selected).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("単元内順位で単元を選択すると単元内順位を取得する", async () => {
    const { result } = renderHook(() => useFetchRank());

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
    const { result } = renderHook(() => useFetchRank());
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

  it("選択が変わったら前の順位を残さない", async () => {
    const { result } = renderHook(() => useFetchRank());
    act(() => {
      result.current.setCourseId(5);
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    act(() => {
      result.current.setCourseId(6);
    });

    expect(result.current.data).toBeNull();
  });

  it("取得に失敗すると error を返し、refetch で取得し直せる", async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("network error"));
    const { result } = renderHook(() => useFetchRank());
    act(() => {
      result.current.setCourseId(5);
    });
    await waitFor(() => expect(result.current.error).toBe(true));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() =>
      expect(result.current.data).toEqual({ rank: 3, total_users: 30 }),
    );
    expect(result.current.error).toBe(false);
  });
});
