import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HighSchoolUsageTable } from "./HighSchoolUsageTable";
import type { HighSchoolUsage } from "./types";

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

const row = (overrides: Partial<HighSchoolUsage>): HighSchoolUsage => ({
  high_school_id: 1,
  high_school_name: "A高校",
  student_count: 100,
  active_student_count: 50,
  active_rate: 50,
  answer_count: 1000,
  accuracy_rate: 60,
  ...overrides,
});

const rows: HighSchoolUsage[] = [
  row({
    high_school_id: 1,
    high_school_name: "A高校",
    active_rate: 70,
    answer_count: 3200,
    student_count: 120,
    active_student_count: 84,
    accuracy_rate: 64.8,
  }),
  row({
    high_school_id: 2,
    high_school_name: "B高校",
    active_rate: 20,
    answer_count: 100,
  }),
  row({
    high_school_id: 3,
    high_school_name: "C高校",
    active_rate: 45,
    answer_count: 500,
  }),
];

// 先頭(ヘッダー)を除いた、本文行の高校名の並び
const schoolNames = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((r) => within(r).getAllByRole("cell")[0].textContent);

describe("HighSchoolUsageTable", () => {
  it("見出しと列ヘッダーを表示する", () => {
    render(<HighSchoolUsageTable rows={rows} />);
    expect(screen.getByText("高校別 利用状況")).toBeVisible();
    for (const name of [
      "高校名",
      "在籍生徒数",
      "アクティブ数",
      "アクティブ率",
      "解答数",
      "正答率",
    ]) {
      expect(screen.getByRole("columnheader", { name })).toBeVisible();
    }
  });

  it("既定ではアクティブ率の昇順(使われていない高校が上)で並ぶ", () => {
    render(<HighSchoolUsageTable rows={rows} />);
    expect(schoolNames()).toEqual(["B高校", "C高校", "A高校"]);
    expect(
      screen.getByRole("columnheader", { name: "アクティブ率" }),
    ).toHaveAttribute("aria-sort", "ascending");
  });

  it("各列の値を表示する", () => {
    render(<HighSchoolUsageTable rows={rows} />);
    const a = screen.getByText("A高校").closest("tr") as HTMLElement;
    expect(within(a).getByText("120")).toBeVisible();
    expect(within(a).getByText("84")).toBeVisible();
    expect(within(a).getByText("70%")).toBeVisible();
    expect(within(a).getByText("3,200")).toBeVisible();
    expect(within(a).getByText("64.8%")).toBeVisible();
  });

  it("アクティブ率の列ヘッダーを再クリックすると降順に切り替わる", () => {
    render(<HighSchoolUsageTable rows={rows} />);
    fireEvent.click(screen.getByRole("button", { name: "アクティブ率" }));
    expect(schoolNames()).toEqual(["A高校", "C高校", "B高校"]);
    expect(
      screen.getByRole("columnheader", { name: "アクティブ率" }),
    ).toHaveAttribute("aria-sort", "descending");
  });

  it("別の列ヘッダーをクリックするとその列の昇順に切り替わる", () => {
    render(<HighSchoolUsageTable rows={rows} />);
    fireEvent.click(screen.getByRole("button", { name: "解答数" }));
    expect(schoolNames()).toEqual(["B高校", "C高校", "A高校"]);
    expect(
      screen.getByRole("columnheader", { name: "解答数" }),
    ).toHaveAttribute("aria-sort", "ascending");
  });

  it("高校名の列でも並べ替えできる", () => {
    render(<HighSchoolUsageTable rows={rows} />);
    fireEvent.click(screen.getByRole("button", { name: "高校名" }));
    fireEvent.click(screen.getByRole("button", { name: "高校名" }));
    expect(schoolNames()).toEqual(["C高校", "B高校", "A高校"]);
  });

  it("高校名は高校詳細画面へのリンクになる", () => {
    render(<HighSchoolUsageTable rows={rows} />);
    expect(screen.getByRole("link", { name: "A高校" })).toHaveAttribute(
      "href",
      "/admin/schools/1",
    );
  });

  it("1行だけのとき(高校フィルタ選択時)もその行を表示する", () => {
    render(<HighSchoolUsageTable rows={[rows[1]]} />);
    expect(schoolNames()).toEqual(["B高校"]);
  });

  it("狭い幅で潰れないよう、横スクロール可能なコンテナに入っている", () => {
    render(<HighSchoolUsageTable rows={rows} />);
    const container = screen.getByRole("table").parentElement as HTMLElement;
    expect(container).toHaveStyle({ overflowX: "auto" });
  });

  it("共通のTableCardで包まれている", () => {
    render(<HighSchoolUsageTable rows={rows} />);
    expect(screen.getByTestId("table-card")).toBeInTheDocument();
  });

  it("行が0件のときは空状態を表示し、テーブルは描画しない", () => {
    render(<HighSchoolUsageTable rows={[]} />);
    expect(screen.getByText("対象期間にデータがありません")).toBeVisible();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
