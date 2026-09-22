import { fireEvent, render, screen } from "@testing-library/react";
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
  message: "インポートを開始しました",
  validCount: 5,
  totalCount: 5,
  onReset: vi.fn(),
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

  it("生徒管理へのリンクが正しいhrefを持つ", () => {
    render(<Step4Complete {...baseProps} />);
    const link = screen.getByRole("link", { name: /生徒管理/ });
    expect(link).toHaveAttribute("href", "/teacher/students");
  });

  it("続けてインポートするボタンでonResetが呼ばれる", () => {
    const onReset = vi.fn();
    render(<Step4Complete {...baseProps} onReset={onReset} />);
    fireEvent.click(screen.getByRole("button", { name: /続けて/ }));
    expect(onReset).toHaveBeenCalled();
  });
});
