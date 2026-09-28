import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Dashboard } from "./index";
import { useFetchDashboard } from "./hooks/useFetchDashboard";
import type { DashboardData } from "./types";

vi.mock("./hooks/useFetchDashboard", () => ({
  useFetchDashboard: vi.fn(),
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

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ローディング中はスケルトンを表示し、スピナーは表示しない", () => {
    vi.mocked(useFetchDashboard).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<Dashboard />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("kpi-card-skeleton")).toHaveLength(4);
  });

  it("エラー時はメッセージと再読み込みボタンを表示する", () => {
    vi.mocked(useFetchDashboard).mockReturnValue({
      data: null,
      loading: false,
      error: "ダッシュボードの取得に失敗しました",
      refetch: vi.fn(),
    });

    render(<Dashboard />);
    expect(
      screen.getByText("ダッシュボードの取得に失敗しました"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "再読み込み" }),
    ).toBeInTheDocument();
  });

  it("再読み込みボタンを押すとrefetchが呼ばれる", async () => {
    const refetch = vi.fn();
    vi.mocked(useFetchDashboard).mockReturnValue({
      data: null,
      loading: false,
      error: "ダッシュボードの取得に失敗しました",
      refetch,
    });

    render(<Dashboard />);
    await userEvent.click(screen.getByRole("button", { name: "再読み込み" }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("データ取得後はPresenterの内容を表示する", () => {
    vi.mocked(useFetchDashboard).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<Dashboard />);
    expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });
});
