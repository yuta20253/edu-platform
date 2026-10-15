import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGetTeachers } from "./useGetTeachers";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useGetTeachers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("申請先の教員一覧を取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { teachers: [{ id: 1, name: "担任先生" }] },
    });
    const { result } = renderHook(() => useGetTeachers());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/teachers");
    expect(result.current.teachers).toEqual([{ id: 1, name: "担任先生" }]);
    expect(result.current.error).toBe(false);
  });

  it("401 のときはログイン画面へ遷移する", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    renderHook(() => useGetTeachers());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("その他のエラーのときは error を true にする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 500 } });
    const { result } = renderHook(() => useGetTeachers());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.loading).toBe(false);
  });
});
