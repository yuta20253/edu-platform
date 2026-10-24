import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { SEARCH_DEBOUNCE_MS, useStudentSearch } from "./useStudentSearch";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const studentsResponse = {
  data: {
    students: [
      { id: 1, name: "山田太郎", name_kana: "ヤマダタロウ" },
      { id: 2, name: "山田花子", name_kana: "ヤマダハナコ" },
    ],
    meta: { current_page: 1, total_pages: 1, total_count: 2, per_page: 20 },
  },
};

const lastParams = () => vi.mocked(apiClient.get).mock.lastCall?.[1]?.params;

describe("useStudentSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue(studentsResponse);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("キーワードが空のときは先頭の生徒を取得し、id と名前の候補にする", async () => {
    const { result } = renderHook(() => useStudentSearch(""));

    await waitFor(() =>
      expect(result.current.options).toEqual([
        { id: 1, name: "山田太郎" },
        { id: 2, name: "山田花子" },
      ]),
    );
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/students", {
      params: { page: "1", per_page: "20" },
      signal: expect.any(AbortSignal),
    });
    expect(result.current.searching).toBe(false);
  });

  it("入力が止まってからキーワード付きで検索し、待っている間は searching を true にする", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result, rerender } = renderHook(
      ({ keyword }) => useStudentSearch(keyword),
      { initialProps: { keyword: "" } },
    );
    await waitFor(() => expect(result.current.searching).toBe(false));

    rerender({ keyword: "山" });
    rerender({ keyword: "山田" });
    expect(result.current.searching).toBe(true);

    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS));

    await waitFor(() => expect(result.current.searching).toBe(false));
    expect(lastParams()).toEqual({
      page: "1",
      per_page: "20",
      keyword: "山田",
    });
    // 途中の入力(「山」)では検索しない
    expect(
      vi
        .mocked(apiClient.get)
        .mock.calls.some(([, config]) => config?.params?.keyword === "山"),
    ).toBe(false);
  });

  it("前後の空白は除いて検索する", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { rerender } = renderHook(
      ({ keyword }) => useStudentSearch(keyword),
      {
        initialProps: { keyword: "" },
      },
    );

    rerender({ keyword: " 山田 " });
    await act(() => vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS));

    await waitFor(() => expect(lastParams()?.keyword).toBe("山田"));
  });

  it("取得に失敗したときは error を true にし、候補は空にする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 500 } });
    const { result } = renderHook(() => useStudentSearch(""));

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.options).toEqual([]);
    expect(result.current.searching).toBe(false);
  });
});
