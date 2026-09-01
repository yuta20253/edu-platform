import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchTeachers } from "./useFetchTeachers";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useFetchTeachers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("教師一覧を取得しteachersにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        teachers: [
          {
            id: 1,
            name: "田中太郎",
            email: "tanaka@example.com",
            grade_scope: "own_grade",
            manage_other_teachers: false,
            grades: [{ id: 1, name: "高１生" }],
          },
        ],
      },
    });

    const { result } = renderHook(() => useFetchTeachers(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.teachers).toHaveLength(1);
    expect(result.current.teachers[0].name).toBe("田中太郎");
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/admin/schools/1/teachers",
    );
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useFetchTeachers(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("refetchで再取得できる", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { teachers: [] } });

    const { result } = renderHook(() => useFetchTeachers(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
  });
});
