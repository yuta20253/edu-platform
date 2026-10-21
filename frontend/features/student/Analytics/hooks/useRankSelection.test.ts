import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useRankSelection } from "./useRankSelection";

const fetchCourseMock = vi.fn();
vi.mock("@/hooks/useCourses", () => ({
  useCourses: () => ({
    courses: null,
    fetchCourse: fetchCourseMock,
  }),
}));

describe("useRankSelection(順位の選択)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初期状態はコース内順位で、コース未選択の間は params が null", () => {
    const { result } = renderHook(() => useRankSelection());

    expect(result.current.type).toBe("course_rank");
    expect(result.current.params).toBeNull();
  });

  it("コースを選択するとコース内順位の params を返す", () => {
    const { result } = renderHook(() => useRankSelection());

    act(() => {
      result.current.setCourseId(5);
    });

    expect(result.current.params).toEqual({
      type: "course_rank",
      course_id: "5",
    });
  });

  it("教科を選択するとその教科のコースを取得し、コース・単元の選択を戻す", () => {
    const { result } = renderHook(() => useRankSelection());
    act(() => {
      result.current.setCourseId(5);
    });

    act(() => {
      result.current.setSubject("数学");
    });

    expect(fetchCourseMock).toHaveBeenCalledWith("数学");
    expect(result.current.courseId).toBeNull();
    expect(result.current.unitId).toBeNull();
    expect(result.current.params).toBeNull();
  });

  it("単元内順位は単元を選択するまで params が null", () => {
    const { result } = renderHook(() => useRankSelection());

    act(() => {
      result.current.setType("unit_rank");
    });
    act(() => {
      result.current.setCourseId(5);
    });

    expect(result.current.params).toBeNull();
  });

  it("単元内順位で単元を選択すると単元内順位の params を返す", () => {
    const { result } = renderHook(() => useRankSelection());

    act(() => {
      result.current.setType("unit_rank");
    });
    act(() => {
      result.current.setCourseId(5);
    });
    act(() => {
      result.current.setUnitId(10);
    });

    expect(result.current.params).toEqual({
      type: "unit_rank",
      course_id: "5",
      unit_id: "10",
    });
  });

  it("順位の種類を切り替えても選択中の教科・コースは残す", () => {
    const { result } = renderHook(() => useRankSelection());
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
});
