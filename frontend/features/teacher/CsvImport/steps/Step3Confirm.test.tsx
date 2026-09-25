import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Step3Confirm } from "./Step3Confirm";

const baseProps = {
  fileName: "students.csv",
  validCount: 5,
  totalCount: 5,
  submitting: false,
  submitError: null as string | null,
  onBack: vi.fn(),
  onSubmit: vi.fn(),
};

describe("Step3Confirm", () => {
  it("影響範囲のサマリが表示される", () => {
    render(<Step3Confirm {...baseProps} />);
    expect(screen.getByText("students.csv")).toBeInTheDocument();
    expect(screen.getByText(/5.*\/.*5/)).toBeInTheDocument();
  });

  it("submitting中は実行ボタンが無効になる", () => {
    render(<Step3Confirm {...baseProps} submitting />);
    expect(screen.getByRole("button", { name: /実行/ })).toBeDisabled();
  });

  it("submitErrorがあるとAlertが表示され再実行可能", () => {
    render(<Step3Confirm {...baseProps} submitError="失敗しました" />);
    expect(screen.getByText("失敗しました")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /実行/ })).toBeEnabled();
  });

  it("戻るボタンでonBackが呼ばれる", () => {
    const onBack = vi.fn();
    render(<Step3Confirm {...baseProps} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("実行ボタンでonSubmitが呼ばれる", () => {
    const onSubmit = vi.fn();
    render(<Step3Confirm {...baseProps} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: /実行/ }));
    expect(onSubmit).toHaveBeenCalled();
  });
});
