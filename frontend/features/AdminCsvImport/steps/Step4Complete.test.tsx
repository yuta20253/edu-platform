import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Step4Complete } from "./Step4Complete";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const baseProps = {
  courseId: 7,
  unitId: 11,
  message: "インポートを開始しました",
  validCount: 5,
  totalCount: 5,
};

describe("Step4Complete", () => {
  it("受付完了メッセージが表示される", () => {
    render(<Step4Complete {...baseProps} />);
    expect(screen.getByText("インポートを開始しました")).toBeInTheDocument();
  });

  it("dry_run由来の参考件数が表示される", () => {
    render(<Step4Complete {...baseProps} />);
    expect(screen.getByText(/5.*\/.*5/)).toBeInTheDocument();
  });

  it("単元詳細へのリンクが正しいhrefを持つ", () => {
    render(<Step4Complete {...baseProps} />);
    const link = screen.getByRole("link", { name: /単元詳細/ });
    expect(link).toHaveAttribute("href", "/admin/courses/7/units/11");
  });

  it("インポート履歴へのリンクが正しいhrefを持つ", () => {
    render(<Step4Complete {...baseProps} />);
    const link = screen.getByRole("link", { name: /インポート履歴/ });
    expect(link).toHaveAttribute("href", "/admin/courses/7/units/11");
  });
});
