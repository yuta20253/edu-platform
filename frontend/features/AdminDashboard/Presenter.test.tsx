import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminDashboardPresenter } from "./Presenter";
import type { AdminDashboardData } from "./types";

const mockData: AdminDashboardData = {
  stats: {
    student_count: 120,
    teacher_count: 8,
    admin_count: 3,
    total_questions: 450,
  },
  recent_imports: [
    {
      id: 1,
      file_name: "mondai_q1.csv",
      status: "completed",
      success_count: 45,
      error_count: 0,
      total_count: 45,
      created_at: "2026-03-20T10:00:00.000Z",
    },
    {
      id: 2,
      file_name: "mondai_q2.csv",
      status: "failed",
      success_count: 0,
      error_count: 10,
      total_count: 10,
      created_at: "2026-03-19T09:00:00.000Z",
    },
  ],
};

describe("AdminDashboardPresenter", () => {
  it("KPI: 生徒数が正しく表示される", () => {
    render(<AdminDashboardPresenter data={mockData} />);
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("KPI: 教師数が正しく表示される", () => {
    render(<AdminDashboardPresenter data={mockData} />);
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("KPI: 総問題数が正しく表示される", () => {
    render(<AdminDashboardPresenter data={mockData} />);
    expect(screen.getByText("450")).toBeInTheDocument();
  });

  it("KPI: 管理者数が正しく表示される", () => {
    render(<AdminDashboardPresenter data={mockData} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("CSVインポート履歴が表示される", () => {
    render(<AdminDashboardPresenter data={mockData} />);
    expect(screen.getByText("mondai_q1.csv")).toBeInTheDocument();
    expect(screen.getByText("mondai_q2.csv")).toBeInTheDocument();
  });

  it("completed ステータスのバッジが表示される", () => {
    render(<AdminDashboardPresenter data={mockData} />);
    expect(screen.getByText("完了")).toBeInTheDocument();
  });

  it("failed ステータスのバッジが表示される", () => {
    render(<AdminDashboardPresenter data={mockData} />);
    expect(screen.getByText("失敗")).toBeInTheDocument();
  });

  it("インポート履歴が空のとき「CSVインポート履歴がありません」が表示される", () => {
    render(
      <AdminDashboardPresenter data={{ ...mockData, recent_imports: [] }} />,
    );
    expect(
      screen.getByText("CSVインポート履歴がありません"),
    ).toBeInTheDocument();
  });
});
