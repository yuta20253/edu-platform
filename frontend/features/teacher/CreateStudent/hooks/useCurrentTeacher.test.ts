import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useCurrentTeacher } from "./useCurrentTeacher";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useCurrentTeacher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("own_gradeの教員は自身のgrade_scopeとgrade_idを取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        user: {
          grade: { id: 5, year: 1, display_name: "1年" },
          teacher_permission: { grade_scope: "own_grade" },
        },
      },
    });

    const { result } = renderHook(() => useCurrentTeacher());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/me");
    expect(result.current.gradeScope).toBe("own_grade");
    expect(result.current.restrictedGradeId).toBe(5);
  });

  it("all_gradesの教員はrestrictedGradeIdがnullになる", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        user: {
          grade: { id: 5, year: 1, display_name: "1年" },
          teacher_permission: { grade_scope: "all_grades" },
        },
      },
    });

    const { result } = renderHook(() => useCurrentTeacher());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.gradeScope).toBe("all_grades");
    expect(result.current.restrictedGradeId).toBeNull();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useCurrentTeacher());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
