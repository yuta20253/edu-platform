import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { AnalyticsSummary } from "./types";

const summary: AnalyticsSummary = {
  streak_days: 5,
  task_completion: {
    current: { completed_count: 6, total_count: 12, completion_rate: 50 },
    previous: { completed_count: 3, total_count: 10, completion_rate: 30 },
  },
  study_minutes: {
    unit: "day",
    series: [{ date: "2026-10-18", minutes: 30 }],
    total: { current: 30, previous: 0 },
  },
  subject_progress: [
    { subject_name: "英語", correct_rate: { current: 62.5, previous: 55 } },
  ],
  meta: {
    from: "2026-10-12",
    to: "2026-10-18",
    previous_from: "2026-10-05",
    previous_to: "2026-10-11",
  },
};

const baseProps = {
  period: { from: "", to: "" },
  onPeriodChange: vi.fn(),
  summary,
  summaryLoading: false,
  summaryError: false,
  validationErrors: [] as string[],
  gradeAverage: {
    correct_rate: { my: 60, average: 55 },
    task_completion_rate: { my: 50, average: 45 },
  },
  understandingScore: { subjects: [] },
  cumulativeLoading: false,
  cumulativeError: false,
  rankSection: <div>順位の中身</div>,
};

const regionNames = () =>
  screen
    .getAllByRole("region")
    .map((region) => region.getAttribute("aria-labelledby"))
    .map((id) => document.getElementById(id ?? "")?.textContent);

describe("AnalyticsPresenter", () => {
  it("見出し「学習分析」が表示される", () => {
    render(<Presenter {...baseProps} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "学習分析" }),
    ).toBeInTheDocument();
  });

  it("期間チップを表示する", () => {
    render(<Presenter {...baseProps} />);
    expect(screen.getByRole("button", { name: "7日間" })).toBeInTheDocument();
  });

  it("上から 連続日数→達成率→学習時間→科目別→(累計)学年平均→理解度→順位 の順に並べる", () => {
    render(<Presenter {...baseProps} />);
    expect(regionNames()).toEqual([
      "連続学習日数",
      "タスク達成率",
      "学習時間",
      "科目別進捗",
      "累計",
      "学年平均との比較",
      "単元別の理解度",
      "順位",
    ]);
  });

  it("累計セクションは期間に関係ないことを表示する", () => {
    render(<Presenter {...baseProps} />);
    expect(screen.getByRole("region", { name: "累計" })).toHaveTextContent(
      "期間に関係なく、これまでの学習全体で集計しています",
    );
  });

  it("順位セクションに順位の中身を表示する", () => {
    render(<Presenter {...baseProps} />);
    expect(screen.getByRole("region", { name: "順位" })).toHaveTextContent(
      "順位の中身",
    );
  });

  it("summary を初めて取得している間はカードの代わりにローディングを表示する", () => {
    render(<Presenter {...baseProps} summary={null} summaryLoading />);
    expect(
      screen.queryByRole("region", { name: "連続学習日数" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("summary-loading")).toBeInTheDocument();
  });

  it("期間を切り替えて再取得している間は前のカードを残し、取得中であることを示す", () => {
    render(<Presenter {...baseProps} summaryLoading />);
    expect(screen.getByTestId("summary-cards")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(
      screen.getByRole("region", { name: "連続学習日数" }),
    ).toBeInTheDocument();
  });

  it("422 のときはチップの直下にメッセージを出し、累計セクションと順位はそのまま表示する", () => {
    render(
      <Presenter
        {...baseProps}
        summary={null}
        validationErrors={["取得期間は366日以内で指定してください"]}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "取得期間は366日以内で指定してください",
    );
    expect(screen.getByRole("button", { name: "7日間" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "累計" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "順位" })).toBeInTheDocument();
  });

  it("summary の取得に失敗したときは期間別のカードの位置にだけエラーを出す", () => {
    render(<Presenter {...baseProps} summary={null} summaryError />);
    expect(screen.getByText("学習分析の取得に失敗しました")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7日間" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "累計" })).toBeInTheDocument();
  });

  it("学年平均の取得に失敗したときはそのカードにだけエラーを出す", () => {
    render(
      <Presenter {...baseProps} gradeAverage={null} cumulativeError />,
    );
    expect(
      screen.getByRole("region", { name: "学年平均との比較" }),
    ).toHaveTextContent("取得に失敗しました");
    expect(
      screen.getByRole("region", { name: "単元別の理解度" }),
    ).toHaveTextContent("学習履歴がありません");
  });

  it("累計の取得中はそれぞれのカードにローディングを表示する", () => {
    render(
      <Presenter
        {...baseProps}
        gradeAverage={null}
        understandingScore={null}
        cumulativeLoading
      />,
    );
    expect(
      within(
        screen.getByRole("region", { name: "学年平均との比較" }),
      ).getByRole("progressbar"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "単元別の理解度" })).getByRole(
        "progressbar",
      ),
    ).toBeInTheDocument();
  });
});
