import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { KpiCards } from "./KpiCards";
import type { DashboardStats } from "./types";

const baseStats: DashboardStats = {
  student_count: 120,
  active_student_count: 87,
  teacher_count: 8,
  admin_count: 3,
  total_questions: 450,
  pending_student_count: 5,
  pending_teacher_count: 1,
};

describe("KpiCards", () => {
  it("4枚のKPIラベルが表示される", () => {
    render(<KpiCards stats={baseStats} activeStudentPeriodDays={30} />);
    expect(screen.getByText("生徒数")).toBeInTheDocument();
    expect(screen.getByText("アクティブ生徒数")).toBeInTheDocument();
    expect(screen.getByText("教師数")).toBeInTheDocument();
    expect(screen.getByText("総問題数")).toBeInTheDocument();
  });

  it("各KPIの値が表示される", () => {
    render(<KpiCards stats={baseStats} activeStudentPeriodDays={30} />);
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("450")).toBeInTheDocument();
  });

  it("生徒数・教師数カードに招待中の人数が表示される", () => {
    render(<KpiCards stats={baseStats} activeStudentPeriodDays={30} />);
    expect(screen.getByText("招待中 5人")).toBeInTheDocument();
    expect(screen.getByText("招待中 1人")).toBeInTheDocument();
  });

  it("招待中が0人のカードはサブ表示を出さない", () => {
    render(
      <KpiCards
        stats={{ ...baseStats, pending_student_count: 0 }}
        activeStudentPeriodDays={30}
      />,
    );
    expect(screen.queryByText(/招待中 0人/)).not.toBeInTheDocument();
  });

  it("アクティブ生徒数のTooltipに期間の定義が表示される", () => {
    render(<KpiCards stats={baseStats} activeStudentPeriodDays={30} />);
    expect(
      screen.getByLabelText("過去30日以内に学習記録がある生徒"),
    ).toBeInTheDocument();
  });

  it("アクティブ生徒数の期間はmetaの値を反映する", () => {
    render(<KpiCards stats={baseStats} activeStudentPeriodDays={7} />);
    expect(
      screen.getByLabelText("過去7日以内に学習記録がある生徒"),
    ).toBeInTheDocument();
  });

  it("管理者数のカードは表示しない", () => {
    render(<KpiCards stats={baseStats} activeStudentPeriodDays={30} />);
    expect(screen.queryByText("管理者数")).not.toBeInTheDocument();
  });
});
