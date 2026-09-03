import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchGrades } from "./useFetchGrades";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useFetchGrades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("学年一覧を取得しgradesにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { grades: [{ id: 1, year: 1, display_name: "高１生" }] },
    });

    const { result } = renderHook(() => useFetchGrades(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.grades).toEqual([
      { id: 1, year: 1, display_name: "高１生" },
    ]);
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/schools/1/grades");
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useFetchGrades(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
