import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchPermissions } from "./useFetchPermissions";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const mockData = {
  current_user: {
    id: 1,
    name: "山田太郎",
    name_kana: "ヤマダタロウ",
    grade: { year: 1, display_name: "1年" },
    invitation_status: "sent" as const,
    teacher_permission: {
      id: 1,
      grade_scope: "all_grades" as const,
      manage_other_teachers: true,
    },
  },
  teachers: [],
  meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 20 },
};

describe("useFetchPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("教員権限一覧を取得しdataにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useFetchPermissions());

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/permissions", {
      params: { page: "1" },
    });
  });

  it("setPage を呼ぶと更新後のページで再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useFetchPermissions());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/teacher/permissions",
        { params: { page: "2" } },
      ),
    );
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    const { result } = renderHook(() => useFetchPermissions());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it("401以外のエラー時はerrorにセットされる", async () => {
    const apiError = { response: { status: 500 } };
    vi.mocked(apiClient.get).mockRejectedValue(apiError);

    const { result } = renderHook(() => useFetchPermissions());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(pushMock).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it("refetch を呼ぶと再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useFetchPermissions());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
  });
});
