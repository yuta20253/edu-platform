import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchDashboard } from "./useFetchDashboard";
import type { DashboardData } from "../types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const mockData: DashboardData = {
  stats: {
    student_count: 120,
    active_student_count: 87,
    teacher_count: 8,
    admin_count: 3,
    total_questions: 450,
    pending_student_count: 5,
    pending_teacher_count: 1,
  },
  recent_imports: [],
  recent_announcements: [],
  meta: {
    active_student_period_days: 30,
    generated_at: "2026-03-20T00:00:00.000Z",
  },
};

describe("useFetchDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ダッシュボードデータを取得しdataにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() => useFetchDashboard());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/dashboard");
  });

  it("取得に失敗するとerrorメッセージがセットされる", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useFetchDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("ダッシュボードの取得に失敗しました");
    expect(result.current.data).toBeNull();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useFetchDashboard());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("refetchを呼ぶと再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });
    const { result } = renderHook(() => useFetchDashboard());
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.refetch();
    });

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it("refetchで成功するとerrorがクリアされる", async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce({
      response: { status: 500 },
    });
    const { result } = renderHook(() => useFetchDashboard());
    await waitFor(() => expect(result.current.error).not.toBeNull());

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(mockData);
  });
});
