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

  it("コース選択肢を取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        courses: [
          {
            id: 10,
            level_number: 1,
            level_name: "基礎",
            subject: { id: 2, name: "数学" },
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

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.courseOptions).toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/courses", {
      params: { per_page: "100" },
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
