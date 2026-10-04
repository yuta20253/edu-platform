import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { AnalyticsData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const data: AnalyticsData = {
  kpis: {
    active_student_count: { current: 87, previous: 74 },
    answer_count: { current: 12480, previous: 10230 },
    accuracy_rate: { current: 68.4, previous: 66.1 },
    study_minutes: { current: 5820, previous: 5010 },
  },
  daily_activity: [
    {
      date: "2026-09-29",
      active_student_count: 40,
      answer_count: 380,
      accuracy_rate: 67.2,
    },
  ],
  low_accuracy_units: [
    {
      unit_id: 12,
      unit_name: "二次関数",
      course_id: 3,
      course_name: "数学I",
      subject_name: "数学",
      answer_count: 420,
      accuracy_rate: 38.1,
    },
  ],
  low_accuracy_questions: [
    {
      question_id: 881,
      question_text: "頂点を求めなさい",
      unit_id: 12,
      unit_name: "二次関数",
      course_id: 3,
      answer_count: 96,
      accuracy_rate: 22.9,
    },
  ],
  high_school_usage: [
    {
      high_school_id: 4,
      high_school_name: "〇〇高校",
      student_count: 120,
      active_student_count: 71,
      active_rate: 59.2,
      answer_count: 3200,
      accuracy_rate: 64.8,
    },
  ],
  content_coverage: {
    total_units: 84,
    units_without_questions: 6,
    units_without_answers: 11,
  },
  meta: {
    from: "2026-09-01",
    to: "2026-09-30",
    previous_from: "2026-08-02",
    previous_to: "2026-08-31",
    min_answer_count: 20,
    ranking_limit: 10,
    max_range_days: 366,
    generated_at: "2026-09-30T16:03:00.000+09:00",
  },
};

const defaultProps = {
  data,
  isInitialLoading: false,
  isRefetching: false,
  error: false,
  validationErrors: [] as string[],
  filters: { from: "", to: "", highSchoolId: "", subjectId: "" },
  highSchoolOptions: [{ id: 4, name: "〇〇高校" }],
  subjectOptions: [{ id: 1, name: "数学" }],
  onFiltersChange: vi.fn(),
  onRetry: vi.fn(),
};

describe("AnalyticsPresenter", () => {
  it("画面タイトルとフィルターバーを表示する", () => {
    render(<Presenter {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: "分析・レポート" }),
    ).toBeVisible();
    expect(screen.getByLabelText("高校")).toBeVisible();
    expect(screen.getByLabelText("科目")).toBeVisible();
  });

  it("データ取得後は6つのセクションをすべて表示する", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("group", { name: "アクティブ生徒数" })).toBeVisible();
    expect(screen.getByText("日別の学習推移")).toBeVisible();
    expect(
      screen.getByRole("region", { name: "正答率が低い単元 ワースト10" }),
    ).toBeVisible();
    expect(
      screen.getByRole("region", { name: "正答率が低い設問 ワースト10" }),
    ).toBeVisible();
    expect(screen.getByText("高校別 利用状況")).toBeVisible();
    expect(screen.getByText("コンテンツカバレッジ")).toBeVisible();
  });

  it("ランキングの注釈に meta.min_answer_count を使う", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("解答数20件以上の単元のみ集計")).toBeVisible();
  });

  it("「準備中」の案内は表示しない", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.queryByText(/準備中/)).not.toBeInTheDocument();
  });

  describe("初期ロード", () => {
    const loading = { ...defaultProps, data: null, isInitialLoading: true };

    it("スケルトンを表示し、スピナーは使わない", () => {
      render(<Presenter {...loading} />);
      expect(screen.getByLabelText("読み込み中")).toBeVisible();
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("ロード中でもタイトルとフィルターバーは表示する", () => {
      render(<Presenter {...loading} />);
      expect(
        screen.getByRole("heading", { name: "分析・レポート" }),
      ).toBeVisible();
      expect(screen.getByLabelText("高校")).toBeVisible();
    });

    it("データ用のセクションはまだ表示しない", () => {
      render(<Presenter {...loading} />);
      expect(screen.queryByText("日別の学習推移")).not.toBeInTheDocument();
    });
  });

  describe("フィルタ変更による再取得", () => {
    it("全画面スケルトンには戻さず、既存のデータを薄く表示する", () => {
      render(<Presenter {...defaultProps} isRefetching />);
      expect(screen.queryByLabelText("読み込み中")).not.toBeInTheDocument();
      expect(screen.getByText("日別の学習推移")).toBeVisible();
      expect(screen.getByTestId("analytics-content")).toHaveStyle({
        opacity: "0.5",
      });
      expect(screen.getByTestId("analytics-content")).toHaveAttribute(
        "aria-busy",
        "true",
      );
    });

    it("再取得中でなければ通常の濃さで表示する", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByTestId("analytics-content")).toHaveStyle({
        opacity: "1",
      });
    });
  });

  describe("エラー", () => {
    const failed = { ...defaultProps, data: null, error: true };

    it("エラーメッセージと再試行ボタンを表示する", () => {
      render(<Presenter {...failed} />);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "分析データの取得に失敗しました",
      );
      expect(screen.getByRole("button", { name: "再試行" })).toBeVisible();
    });

    it("再試行ボタンで onRetry が呼ばれる", () => {
      const onRetry = vi.fn();
      render(<Presenter {...failed} onRetry={onRetry} />);
      fireEvent.click(screen.getByRole("button", { name: "再試行" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("エラー中でもフィルターバーは操作できる", () => {
      render(<Presenter {...failed} />);
      expect(screen.getByLabelText("高校")).toBeVisible();
    });

    it("エラー時はスケルトンもデータセクションも表示しない", () => {
      render(<Presenter {...failed} />);
      expect(screen.queryByLabelText("読み込み中")).not.toBeInTheDocument();
      expect(screen.queryByText("日別の学習推移")).not.toBeInTheDocument();
    });
  });

  describe("期間不正(422)", () => {
    const invalid = {
      ...defaultProps,
      data: null,
      validationErrors: ["指定できる期間は366日以内です"],
    };

    it("フィルターバー直下にメッセージを表示する", () => {
      render(<Presenter {...invalid} />);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "指定できる期間は366日以内です",
      );
    });

    it("全画面エラー(再試行ボタン)にはしない", () => {
      render(<Presenter {...invalid} />);
      expect(
        screen.queryByRole("button", { name: "再試行" }),
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText("高校")).toBeVisible();
    });

    it("前回のデータがあれば表示を維持する", () => {
      render(<Presenter {...invalid} data={data} />);
      expect(screen.getByText("日別の学習推移")).toBeVisible();
    });
  });
});
