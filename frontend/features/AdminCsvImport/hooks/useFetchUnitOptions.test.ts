import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchUnitOptions } from "./useFetchUnitOptions";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useFetchUnitOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("courseIdがnullのときは取得せずunitsは空配列", () => {
    const { result } = renderHook(() => useFetchUnitOptions(null));
    expect(result.current.units).toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("courseIdが指定されると講座詳細から単元一覧を取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        id: 7,
        units: [
          { id: 11, unit_name: "二次関数", questions_count: 5 },
          { id: 12, unit_name: "図形", questions_count: 0 },
        ],
      },
    });

    const { result } = renderHook(() => useFetchUnitOptions(7));

    await waitFor(() => expect(result.current.unitsLoading).toBe(false));
    expect(result.current.units).toEqual([
      { id: 11, unit_name: "二次関数" },
      { id: 12, unit_name: "図形" },
    ]);
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/courses/7", {
      signal: expect.any(AbortSignal),
    });
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useFetchUnitOptions(7));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
