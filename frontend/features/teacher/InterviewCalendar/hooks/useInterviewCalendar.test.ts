import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CanceledError, type AxiosRequestConfig } from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { useInterviewCalendar } from "./useInterviewCalendar";
import type { ScheduledInterview } from "../types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

// axios と同じく、signal が中断されたら CanceledError で reject する応答
const pendingUntilAborted = (_url: string, config?: AxiosRequestConfig) =>
  new Promise((_, reject) => {
    config?.signal?.addEventListener?.("abort", () =>
      reject(new CanceledError()),
    );
  });

const interview = (id: number, scheduledAt: Date): ScheduledInterview => ({
  id,
  status: "confirmed",
  initiator_role: "student",
  reason_category: "career",
  reason_detail: "進路について相談したい",
  scheduled_at: scheduledAt.toISOString(),
  completed_at: null,
  cancelled_at: null,
  cancel_reason: null,
  lock_version: 0,
  created_at: new Date(2026, 9, 1).toISOString(),
  student_id: 2,
  student_name: "山田太郎",
  teacher_id: 3,
  teacher_name: "佐藤先生",
});

const response = (interviewRequests: unknown[]) => ({
  data: {
    interview_requests: interviewRequests,
    meta: {
      current_page: 1,
      total_pages: 1,
      total_count: interviewRequests.length,
      per_page: 100,
    },
  },
});

const octoberInterviews = [interview(1, new Date(2026, 9, 10, 10, 0))];

describe("useInterviewCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 6, 12, 0, 0));
    vi.mocked(apiClient.get).mockResolvedValue(response(octoberInterviews));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初期表示では今月のグリッド範囲で面談を取得する", async () => {
    const { result } = renderHook(() => useInterviewCalendar());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.month?.getFullYear()).toBe(2026);
    expect(result.current.month?.getMonth()).toBe(9);
    expect(result.current.interviews).toEqual(octoberInterviews);
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/teacher/calendar", {
      params: { from: "2026-09-27", to: "2026-10-31" },
      signal: expect.any(AbortSignal),
    });
  });

  it("マウント後に今日の日付を today として返す", async () => {
    const { result } = renderHook(() => useInterviewCalendar());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.today).toEqual(new Date(2026, 9, 6, 12, 0, 0));
  });

  it("日時が未設定の面談は除外する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      response([
        ...octoberInterviews,
        { ...interview(9, new Date(2026, 9, 11)), scheduled_at: null },
      ]),
    );

    const { result } = renderHook(() => useInterviewCalendar());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.interviews).toEqual(octoberInterviews);
  });

  it("goNextMonth で翌月の範囲を再取得する", async () => {
    const { result } = renderHook(() => useInterviewCalendar());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.goNextMonth());

    expect(result.current.month?.getMonth()).toBe(10);
    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith("/api/teacher/calendar", {
        params: { from: "2026-11-01", to: "2026-12-05" },
        signal: expect.any(AbortSignal),
      }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("goPrevMonth で前月の範囲を再取得する", async () => {
    const { result } = renderHook(() => useInterviewCalendar());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.goPrevMonth());

    expect(result.current.month?.getMonth()).toBe(8);
    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith("/api/teacher/calendar", {
        params: { from: "2026-08-30", to: "2026-10-03" },
        signal: expect.any(AbortSignal),
      }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("goThisMonth で今月に戻る", async () => {
    const { result } = renderHook(() => useInterviewCalendar());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.goNextMonth());
    act(() => result.current.goNextMonth());
    act(() => result.current.goThisMonth());

    expect(result.current.month?.getMonth()).toBe(9);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("月切り替え後、取得完了までは前の月の面談を返さない", async () => {
    const { result } = renderHook(() => useInterviewCalendar());
    await waitFor(() =>
      expect(result.current.interviews).toEqual(octoberInterviews),
    );
    vi.mocked(apiClient.get).mockReturnValueOnce(new Promise(() => {}));

    act(() => result.current.goNextMonth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.interviews).toEqual([]);
  });

  it("月を切り替えると前の月のリクエストを中断し、新しい月の結果だけを反映する", async () => {
    const novemberInterviews = [interview(2, new Date(2026, 10, 3, 16, 0))];
    vi.mocked(apiClient.get)
      .mockImplementationOnce(pendingUntilAborted)
      .mockResolvedValueOnce(response(novemberInterviews));

    const { result } = renderHook(() => useInterviewCalendar());
    act(() => result.current.goNextMonth());

    const octoberSignal = vi.mocked(apiClient.get).mock.calls[0][1]?.signal;
    expect(octoberSignal?.aborted).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.interviews).toEqual(novemberInterviews);
    expect(result.current.error).toBe(false);
  });

  it("アンマウント時にリクエストを中断する", () => {
    vi.mocked(apiClient.get).mockImplementationOnce(pendingUntilAborted);

    const { unmount } = renderHook(() => useInterviewCalendar());
    unmount();

    const signal = vi.mocked(apiClient.get).mock.calls[0][1]?.signal;
    expect(signal?.aborted).toBe(true);
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });

    const { result } = renderHook(() => useInterviewCalendar());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(result.current.error).toBe(false);
  });

  it("401以外のエラー時はerrorをtrueにする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 500 } });

    const { result } = renderHook(() => useInterviewCalendar());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("refetch で表示中の月を再取得し、成功すれば error を false に戻す", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce(response(octoberInterviews));

    const { result } = renderHook(() => useInterviewCalendar());
    await waitFor(() => expect(result.current.error).toBe(true));

    act(() => result.current.refetch());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe(false);
    expect(result.current.interviews).toEqual(octoberInterviews);
    expect(apiClient.get).toHaveBeenCalledTimes(2);
    expect(apiClient.get).toHaveBeenLastCalledWith("/api/teacher/calendar", {
      params: { from: "2026-09-27", to: "2026-10-31" },
      signal: expect.any(AbortSignal),
    });
  });
});
