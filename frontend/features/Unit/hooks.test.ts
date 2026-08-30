import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGetUnit } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useGetUnit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("単元データを取得しunitにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        id: 11,
        course_id: 1,
        unit_name: "二次関数",
        course: { id: 1, level_number: 1, level_name: "標準" },
      },
    });

    const { result } = renderHook(() => useGetUnit({ taskId: 5, unitId: 11 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(false);
    expect(result.current.unit?.unit_name).toBe("二次関数");
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/student/tasks/5/units/11",
    );
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useGetUnit({ taskId: 5, unitId: 11 }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("401以外のエラー時はerrorがtrueになりunitはnullのまま", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useGetUnit({ taskId: 5, unitId: 11 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.unit).toBeNull();
  });
});
