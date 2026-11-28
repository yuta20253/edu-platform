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
      expect.objectContaining({ params: { page: "1" } }),
    );
  });

  describe("ページネーション", () => {
    const teacher = (id: number) => ({
      id,
      name: `教員${id}`,
      name_kana: `キョウイン${id}`,
      email: `t${id}@example.com`,
      grade_scope: "own_grade",
      manage_other_teachers: false,
      grades: [],
      permission_lock_version: 0,
    });
    const meta = (page: number) => ({
      current_page: page,
      total_pages: 2,
      total_count: 21,
      per_page: 20,
    });

    it("meta を返す", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { teachers: [teacher(1)], meta: meta(1) },
      });

      const { result } = renderHook(() => useFetchTeachers(1));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.meta).toEqual(meta(1));
      expect(result.current.page).toBe(1);
    });

    it("setPage で指定したページを取得する", async () => {
      vi.mocked(apiClient.get).mockImplementation((_url, config) =>
        Promise.resolve({
          data: {
            teachers: [teacher(config?.params.page === "2" ? 21 : 1)],
            meta: meta(Number(config?.params.page)),
          },
        }),
      );

      const { result } = renderHook(() => useFetchTeachers(1));
      await waitFor(() => expect(result.current.teachers[0]?.id).toBe(1));

      act(() => result.current.setPage(2));

      await waitFor(() => expect(result.current.teachers[0]?.id).toBe(21));
      expect(result.current.page).toBe(2);
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/admin/schools/1/teachers",
        expect.objectContaining({ params: { page: "2" } }),
      );
    });

    it("ページを切り替えている間も、前のページの教員を残す（loading にならない）", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { teachers: [teacher(1)], meta: meta(1) },
      });
      const { result } = renderHook(() => useFetchTeachers(1));
      await waitFor(() => expect(result.current.teachers).toHaveLength(1));

      vi.mocked(apiClient.get).mockReturnValueOnce(new Promise(() => {}));
      act(() => result.current.setPage(2));

      expect(result.current.loading).toBe(false);
      expect(result.current.teachers[0]?.id).toBe(1);
    });
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
