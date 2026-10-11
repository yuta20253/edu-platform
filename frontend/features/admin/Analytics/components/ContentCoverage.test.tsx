import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContentCoverage } from "./ContentCoverage";

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

const coverage = {
  total_units: 84,
  units_without_questions: 6,
  units_without_answers: 11,
};

describe("ContentCoverage", () => {
  it("見出しを表示する", () => {
    render(<ContentCoverage coverage={coverage} />);
    expect(screen.getByText("コンテンツカバレッジ")).toBeVisible();
  });

  it("総単元数を表示する", () => {
    render(<ContentCoverage coverage={coverage} />);
    expect(screen.getByText("総単元数")).toBeVisible();
    expect(screen.getByText("84件")).toBeVisible();
  });

  it("問題が未登録の単元の件数を表示する", () => {
    render(<ContentCoverage coverage={coverage} />);
    expect(screen.getByText("問題が未登録の単元")).toBeVisible();
    expect(screen.getByText("6件")).toBeVisible();
  });

  it("期間内に解答がない単元の件数を表示する", () => {
    render(<ContentCoverage coverage={coverage} />);
    expect(screen.getByText("期間内に解答がない単元")).toBeVisible();
    expect(screen.getByText("11件")).toBeVisible();
  });

  it("未登録の単元があるときは講座一覧(CSVインポート)への導線を表示する", () => {
    render(<ContentCoverage coverage={coverage} />);
    expect(
      screen.getByRole("link", { name: "講座一覧で問題をインポートする" }),
    ).toHaveAttribute("href", "/admin/courses");
  });

  it("未登録の単元が0件のときは導線を表示しない", () => {
    render(
      <ContentCoverage
        coverage={{ ...coverage, units_without_questions: 0 }}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
