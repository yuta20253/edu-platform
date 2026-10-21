import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { AnalyticsSummary, SummaryState } from "./types";

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

const summaryProps: SummaryState = {
  data: summary,
  refreshing: false,
  error: false,
  validationErrors: [],
  refetch: vi.fn(),
};

const baseProps = {
  period: { from: "", to: "" },
  onPeriodChange: vi.fn(),
  summary: summaryProps,
  gradeAverage: {
    data: {
      correct_rate: { my: 60, average: 55 },
      task_completion_rate: { my: 50, average: 45 },
    },
    error: false,
    refetch: vi.fn(),
  },
  understandingScore: {
    data: { subjects: [] },
    error: false,
    refetch: vi.fn(),
  },
  rankSection: <div>順位の中身</div>,
};

const summaryState = (overrides: Partial<SummaryState>): SummaryState => ({
  ...baseProps.summary,
  ...overrides,
});

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
    render(<Presenter {...baseProps} summary={summaryState({ data: null })} />);
    expect(
      screen.queryByRole("region", { name: "連続学習日数" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("期間を切り替えて再取得している間は前のカードを残し、取得中であることを示す", () => {
    render(
      <Presenter {...baseProps} summary={summaryState({ refreshing: true })} />,
    );
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
        summary={summaryState({
          data: null,
          validationErrors: ["取得期間は366日以内で指定してください"],
        })}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "取得期間は366日以内で指定してください",
    );
    expect(screen.getByRole("button", { name: "7日間" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "累計" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "順位" })).toBeInTheDocument();
  });

  it("summary の取得に失敗したときは期間別のカードの位置にだけエラーを出し、再試行できる", async () => {
    const refetch = vi.fn();
    render(
      <Presenter
        {...baseProps}
        summary={summaryState({ data: null, error: true, refetch })}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(refetch).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "7日間" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "累計" })).toBeInTheDocument();
  });

  it("学年平均の取得に失敗したときはそのカードにだけエラーを出し、再試行できる", async () => {
    const refetch = vi.fn();
    render(
      <Presenter
        {...baseProps}
        gradeAverage={{ data: null, error: true, refetch }}
      />,
    );
    const card = screen.getByRole("region", { name: "学年平均との比較" });
    expect(within(card).getByRole("alert")).toBeInTheDocument();
    await userEvent.click(within(card).getByRole("button", { name: "再試行" }));
    expect(refetch).toHaveBeenCalled();
    expect(
      screen.getByRole("region", { name: "単元別の理解度" }),
    ).toHaveTextContent("学習履歴がありません");
  });

  it("累計の取得中はそれぞれのカードにローディングを表示する", () => {
    render(
      <Presenter
        {...baseProps}
        gradeAverage={{ ...baseProps.gradeAverage, data: null }}
        understandingScore={{ ...baseProps.understandingScore, data: null }}
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
