import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useTeacherDetail } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useTeacherDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("教員詳細を取得しdataにセットする", async () => {
    const teacher = { id: 1, name: "山田太郎" };
    vi.mocked(apiClient.get).mockResolvedValue({ data: teacher });

    const { result } = renderHook(() => useTeacherDetail(1));

    await waitFor(() => expect(result.current.data).toEqual(teacher));
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/teachers/1", {
      params: undefined,
      signal: expect.any(AbortSignal),
    });
  });

  it("取得に失敗するとerrorがtrueになりdataはnullのままになる", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 500 } });

    const { result } = renderHook(() => useTeacherDetail(1));

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.data).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("401エラー時はログイン画面へリダイレクトし、エラー状態にはしない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });

    const { result } = renderHook(() => useTeacherDetail(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(result.current.error).toBe(false);
  });
});
