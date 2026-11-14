import { act, renderHook, waitFor } from "@testing-library/react";
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

    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe("/api/teacher/me");
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

    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(result.current.gradeScope).toBe("all_grades");
    expect(result.current.restrictedGradeId).toBeNull();
  });

  it("teacher_permissionがnullの場合はgradeScope/restrictedGradeIdともにnullになる", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        user: {
          grade: { id: 5, year: 1, display_name: "1年" },
          teacher_permission: null,
        },
      },
    });

    const { result } = renderHook(() => useCurrentTeacher());

    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(result.current.gradeScope).toBeNull();
    expect(result.current.restrictedGradeId).toBeNull();
    expect(result.current.error).toBe(false);
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    const { result } = renderHook(() => useCurrentTeacher());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(result.current.error).toBe(false);
  });

  it("取得前はdataがnullで、gradeScope/restrictedGradeIdもnullになる", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCurrentTeacher());

    expect(result.current.data).toBeNull();
    expect(result.current.gradeScope).toBeNull();
    expect(result.current.restrictedGradeId).toBeNull();
  });

  it("失敗後にrefetchすると再取得して値が入り、errorが消える", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({
        data: {
          user: {
            grade: { id: 5 },
            teacher_permission: { grade_scope: "own_grade" },
          },
        },
      });

    const { result } = renderHook(() => useCurrentTeacher());
    await waitFor(() => expect(result.current.error).toBe(true));

    act(() => result.current.refetch());

    await waitFor(() => expect(result.current.restrictedGradeId).toBe(5));
    expect(result.current.error).toBe(false);
  });

  it("401以外のエラー時はerrorがtrueになり学年制限を不明なまま扱わない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useCurrentTeacher());

    await waitFor(() => expect(result.current.error).toBe(true));

    expect(result.current.data).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
