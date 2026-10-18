import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AnalyticsContent } from "./AnalyticsContent";

const baseProps = {
  type: "course_rank" as const,
  data: null,
  courseId: null,
  unitId: null,
  loading: false,
  error: false,
};

describe("AnalyticsContent(順位)", () => {
  it("コース内順位でコース未選択の場合は案内メッセージを表示する", () => {
    render(<AnalyticsContent {...baseProps} />);
    expect(
      screen.getByText("教科とコースを選択してください"),
    ).toBeInTheDocument();
  });

  it("単元内順位で単元未選択の場合は案内メッセージを表示する", () => {
    render(<AnalyticsContent {...baseProps} type="unit_rank" courseId={1} />);
    expect(
      screen.getByText("コースと単元を選択してください"),
    ).toBeInTheDocument();
  });

  it("取得中はローディングを表示する", () => {
    render(<AnalyticsContent {...baseProps} courseId={1} loading />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("取得に失敗したときはこのセクションにだけエラーを表示する", () => {
    render(<AnalyticsContent {...baseProps} courseId={1} error />);
    expect(screen.getByText("順位の取得に失敗しました")).toBeInTheDocument();
  });

  it("順位のデータが渡されると順位を表示する", () => {
    render(
      <AnalyticsContent
        {...baseProps}
        data={{ rank: 3, total_users: 30 }}
        courseId={1}
      />,
    );
    expect(screen.getByText("30人中 3位")).toBeInTheDocument();
  });
});
