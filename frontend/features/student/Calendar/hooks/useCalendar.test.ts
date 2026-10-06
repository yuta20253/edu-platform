import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useCalendar } from "./useCalendar";
import type { CalendarEvent } from "../types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const octoberEvents: CalendarEvent[] = [
  {
    type: "goal",
    id: 1,
    date: "2026/10/10",
    title: "目標",
    status: "in_progress",
  },
];

describe("useCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 6, 12, 0, 0));
    vi.mocked(apiClient.get).mockResolvedValue({ data: octoberEvents });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初期表示では今月のグリッド範囲でイベントを取得する", async () => {
    const { result } = renderHook(() => useCalendar());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.month.getFullYear()).toBe(2026);
    expect(result.current.month.getMonth()).toBe(9);
    expect(result.current.events).toEqual(octoberEvents);
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/calendar", {
      params: { from: "2026-09-27", to: "2026-10-31" },
    });
  });

  it("未知の種別のイベントは除外する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        ...octoberEvents,
        {
          type: "announcement",
          id: 9,
          date: "2026/10/11",
          title: "お知らせ",
          status: "scheduled",
        },
      ],
    });

    const { result } = renderHook(() => useCalendar());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.events).toEqual(octoberEvents);
  });

  it("goNextMonth で翌月の範囲を再取得する", async () => {
    const { result } = renderHook(() => useCalendar());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.goNextMonth());

    expect(result.current.month.getMonth()).toBe(10);
    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith("/api/student/calendar", {
        params: { from: "2026-11-01", to: "2026-12-05" },
      }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("goPrevMonth で前月の範囲を再取得する", async () => {
    const { result } = renderHook(() => useCalendar());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.goPrevMonth());

    expect(result.current.month.getMonth()).toBe(8);
    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith("/api/student/calendar", {
        params: { from: "2026-08-30", to: "2026-10-03" },
      }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("goThisMonth で今月に戻る", async () => {
    const { result } = renderHook(() => useCalendar());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.goNextMonth());
    act(() => result.current.goNextMonth());
    act(() => result.current.goThisMonth());

    expect(result.current.month.getMonth()).toBe(9);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("月切り替え後、取得完了までは前の月のイベントを返さない", async () => {
    const { result } = renderHook(() => useCalendar());
    await waitFor(() => expect(result.current.events).toEqual(octoberEvents));
    vi.mocked(apiClient.get).mockReturnValueOnce(new Promise(() => {}));

    act(() => result.current.goNextMonth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.events).toEqual([]);
  });

  it("月切り替え中に前の月のレスポンスが遅れて返っても反映しない", async () => {
    let resolveOctober: (value: { data: CalendarEvent[] }) => void = () => {};
    const novemberEvents: CalendarEvent[] = [
      {
        type: "task",
        id: 2,
        date: "2026/11/03",
        title: "タスク",
        status: "not_started",
      },
    ];
    vi.mocked(apiClient.get)
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveOctober = resolve)),
      )
      .mockResolvedValueOnce({ data: novemberEvents });

    const { result } = renderHook(() => useCalendar());
    act(() => result.current.goNextMonth());
    await waitFor(() => expect(result.current.events).toEqual(novemberEvents));

    await act(async () => resolveOctober({ data: octoberEvents }));

    expect(result.current.events).toEqual(novemberEvents);
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });

    const { result } = renderHook(() => useCalendar());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(result.current.error).toBe(false);
  });

  it("401以外のエラー時はerrorをtrueにする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 500 } });

    const { result } = renderHook(() => useCalendar());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(pushMock).not.toHaveBeenCalled();
  });
});
