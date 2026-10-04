import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { KpiCards } from "./KpiCards";
import type { AnalyticsKpis } from "./types";

const kpis: AnalyticsKpis = {
  active_student_count: { current: 87, previous: 74 },
  answer_count: { current: 12480, previous: 10230 },
  accuracy_rate: { current: 68.4, previous: 70.1 },
  study_minutes: { current: 5820, previous: 5820 },
};

const card = (label: string) =>
  screen.getByRole("group", { name: label });

describe("KpiCards", () => {
  it("4つのKPIカードのラベルが表示される", () => {
    render(<KpiCards kpis={kpis} />);
    for (const label of [
      "アクティブ生徒数",
      "総解答数",
      "全体正答率",
      "総学習時間",
    ]) {
      expect(card(label)).toBeVisible();
    }
  });

  it("アクティブ生徒数は人数をそのまま表示する", () => {
    render(<KpiCards kpis={kpis} />);
    expect(within(card("アクティブ生徒数")).getByText("87")).toBeVisible();
  });

  it("総解答数は3桁区切りで表示する", () => {
    render(<KpiCards kpis={kpis} />);
    expect(within(card("総解答数")).getByText("12,480")).toBeVisible();
  });

  it("全体正答率は%付きで表示する", () => {
    render(<KpiCards kpis={kpis} />);
    expect(within(card("全体正答率")).getByText("68.4%")).toBeVisible();
  });

  it("総学習時間は「◯時間◯分」に整形して表示する", () => {
    render(<KpiCards kpis={kpis} />);
    expect(within(card("総学習時間")).getByText("97時間0分")).toBeVisible();
  });

  it("前期間より増えた指標は上向き矢印と増加率を表示する", () => {
    render(<KpiCards kpis={kpis} />);
    const trend = within(card("アクティブ生徒数")).getByTestId("kpi-trend");
    expect(trend).toHaveAttribute("data-direction", "up");
    expect(trend).toHaveTextContent("17.6%");
    expect(within(trend).getByTestId("ArrowUpwardIcon")).toBeInTheDocument();
  });

  it("前期間より減った指標は下向き矢印と減少率を表示する", () => {
    render(<KpiCards kpis={kpis} />);
    const trend = within(card("全体正答率")).getByTestId("kpi-trend");
    expect(trend).toHaveAttribute("data-direction", "down");
    expect(trend).toHaveTextContent("2.4%");
    expect(within(trend).getByTestId("ArrowDownwardIcon")).toBeInTheDocument();
  });

  it("前期間と同じ指標は増減なしと表示する", () => {
    render(<KpiCards kpis={kpis} />);
    const trend = within(card("総学習時間")).getByTestId("kpi-trend");
    expect(trend).toHaveAttribute("data-direction", "flat");
    expect(trend).toHaveTextContent("±0%");
  });

  it("前期間が0で増加した場合は率を出さず「前期間なし」と表示する", () => {
    render(
      <KpiCards
        kpis={{ ...kpis, answer_count: { current: 100, previous: 0 } }}
      />,
    );
    const trend = within(card("総解答数")).getByTestId("kpi-trend");
    expect(trend).toHaveAttribute("data-direction", "up");
    expect(trend).toHaveTextContent("前期間なし");
  });

  it("「前期間比」のラベルを表示する", () => {
    render(<KpiCards kpis={kpis} />);
    expect(
      within(card("アクティブ生徒数")).getByText("前期間比"),
    ).toBeVisible();
  });

  it("アクティブ生徒数の定義が Tooltip で確認できる", async () => {
    const user = userEvent.setup();
    render(<KpiCards kpis={kpis} />);

    await user.hover(screen.getByTestId("InfoOutlinedIcon"));

    expect(
      await screen.findByText(
        "期間内に解答または学習記録がある生徒（ログイン履歴は記録していません）",
      ),
    ).toBeVisible();
  });
});
