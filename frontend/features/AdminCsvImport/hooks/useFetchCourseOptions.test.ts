import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchCourseOptions } from "./useFetchCourseOptions";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useFetchCourseOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("講座一覧を取得しcoursesにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        courses: [
          {
            id: 1,
            subject: { id: 1, name: "数学" },
            level_name: "標準",
            level_number: 1,
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 1,
          total_count: 1,
          per_page: 100,
        },
      },
    });

    const { result } = renderHook(() => useFetchCourseOptions());

    await waitFor(() => expect(result.current.coursesLoading).toBe(false));
    expect(result.current.courses).toHaveLength(1);
    expect(result.current.courses[0].level_name).toBe("標準");
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/courses", {
      params: { per_page: "100" },
      signal: expect.any(AbortSignal),
    });
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useFetchCourseOptions());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
