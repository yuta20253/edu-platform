import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useInitialStudent } from "./useInitialStudent";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useInitialStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("生徒 id が無いときは取得せず、すぐに ready にする", () => {
    const { result } = renderHook(() => useInitialStudent(undefined));

    expect(result.current).toEqual({ student: null, ready: true });
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("生徒 id があるときは生徒を取得し、取得するまでは ready にしない", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { id: 150, name: "山田太郎", name_kana: "ヤマダタロウ" },
    });
    const { result } = renderHook(() => useInitialStudent(150));

    expect(result.current.ready).toBe(false);
    await waitFor(() =>
      expect(result.current).toEqual({
        student: { id: 150, name: "山田太郎" },
        ready: true,
      }),
    );
    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe(
      "/api/teacher/students/150",
    );
  });

  it("取得に失敗したときは未選択のまま ready にする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 404 } });
    const { result } = renderHook(() => useInitialStudent(999));

    await waitFor(() =>
      expect(result.current).toEqual({ student: null, ready: true }),
    );
  });
});
