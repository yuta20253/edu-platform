import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import axios from "axios";
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

  it("クラス詳細を取得しschoolClassにセットする", async () => {
    const mockSchoolClass = {
      id: 10,
      name: "1組",
      grade: { id: 1, year: 1, display_name: "高校1年" },
      teachers: [],
      students: [],
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockSchoolClass });

    const { result } = renderHook(() => useSchoolClass(10));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.schoolClass).toEqual(mockSchoolClass);
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/teacher/school-classes/10",
      { signal: expect.any(AbortSignal) },
    );
  });

  it("schoolClassIdが変わると前回のリクエストをabortする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 10 } });

    const { result, rerender } = renderHook(({ id }) => useSchoolClass(id), {
      initialProps: { id: 10 },
    });

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));
    const firstSignal = vi.mocked(apiClient.get).mock.calls[0][1]?.signal;
    expect(firstSignal?.aborted).toBe(false);

    act(() => {
      rerender({ id: 11 });
    });

    expect(firstSignal?.aborted).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("キャンセルされた古いリクエストの結果で新しい結果を上書きせず、エラーにもしない", async () => {
    const schoolClass11 = {
      id: 11,
      name: "2組",
      grade: { id: 1, year: 1, display_name: "高校1年" },
      teachers: [],
      students: [],
    };
    vi.mocked(apiClient.get).mockImplementation((url, config) => {
      if (url.endsWith("/10")) {
        // id=10 は遅延し、abortされるとキャンセルエラーで reject される
        return new Promise((_resolve, reject) => {
          config?.signal?.addEventListener?.("abort", () =>
            reject(new axios.CanceledError()),
          );
        });
      }
      return Promise.resolve({ data: schoolClass11 });
    });

    const { result, rerender } = renderHook(({ id }) => useSchoolClass(id), {
      initialProps: { id: 10 },
    });

    act(() => {
      rerender({ id: 11 });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.schoolClass).toEqual(schoolClass11);
    expect(result.current.error).toBe(false);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("401エラー時はログイン画面へリダイレクトし、エラー状態にはしない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    const { result } = renderHook(() => useSchoolClass(10));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(false);
  });

  it("401以外のエラー時はerrorをtrueにしschoolClassをnullにする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useSchoolClass(10));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.schoolClass).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
