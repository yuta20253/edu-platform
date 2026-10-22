import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useSchoolClass } from "./useSchoolClass";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useSchoolClass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("クラス詳細を取得しdataにセットする", async () => {
    const mockSchoolClass = {
      id: 10,
      name: "1組",
      grade: { id: 1, year: 1, display_name: "高校1年" },
      teachers: [],
      students: [],
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockSchoolClass });

    const { result } = renderHook(() => useSchoolClass(10));

    await waitFor(() => expect(result.current.data).toEqual(mockSchoolClass));
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/teacher/school-classes/10",
      { params: undefined, signal: expect.any(AbortSignal) },
    );
  });

  it("401エラー時はログイン画面へリダイレクトし、エラー状態にはしない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });

    const { result } = renderHook(() => useSchoolClass(10));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(result.current.error).toBe(false);
  });

  it("401以外のエラー時はerrorをtrueにしdataをnullのままにする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 500 } });

    const { result } = renderHook(() => useSchoolClass(10));

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.data).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
