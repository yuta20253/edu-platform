import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useStudentSearch } from "./useStudentSearch";

const routerMock = { push: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const emptyOptions = {
  grades: [],
  user_roles: [],
  students: {
    items: [],
    meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 20 },
  },
  own_grade_restriction: null,
};

describe("useStudentSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(apiClient.get).mockResolvedValue({ data: emptyOptions });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("入力値はすぐ反映するが、検索は入力が止まって300ms後に最後のキーワードで1回だけ行う", () => {
    const { result } = renderHook(() => useStudentSearch());
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleQueryChange("や");
      result.current.handleQueryChange("やま");
    });

    expect(result.current.query).toBe("やま");
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(apiClient.get).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(apiClient.get).toHaveBeenCalledTimes(2);
    expect(apiClient.get).toHaveBeenLastCalledWith(
      "/api/teacher/announcements/new",
      {
        params: { page: "1", keyword: "やま" },
        signal: expect.any(AbortSignal),
      },
    );
  });

  it("キーワードが変わるとページを1に戻す", () => {
    const { result } = renderHook(() => useStudentSearch());

    act(() => {
      result.current.setPage(3);
    });
    expect(result.current.page).toBe(3);

    act(() => {
      result.current.handleQueryChange("さとう");
      vi.advanceTimersByTime(300);
    });

    expect(result.current.page).toBe(1);
  });
});
