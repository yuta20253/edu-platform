import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useSchoolDetail } from "./hooks";

const pushMock = vi.fn();
// useRouter は同じ参照を返す（毎回新しい参照だと、依存に含む effect が再実行され続ける）
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const school = {
  id: 1,
  name: "東京高校",
  prefecture_name: "東京都",
  student_count: 3,
  teacher_count: 2,
};

describe("useSchoolDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("school キーに包まれたレスポンスから高校詳細を取り出す", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { school } });

    const { result } = renderHook(() => useSchoolDetail(1));

    await waitFor(() => expect(result.current.school).toEqual(school));
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/schools/1");
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });

    renderHook(() => useSchoolDetail(1));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("401以外の失敗は error になり、retry で再取得する", async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce({ response: { status: 500 } });
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { school } });

    const { result } = renderHook(() => useSchoolDetail(1));
    await waitFor(() => expect(result.current.error).toBe(true));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.school).toEqual(school));
    expect(result.current.error).toBe(false);
  });
});
