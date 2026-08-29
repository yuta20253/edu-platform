import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Step3Confirm } from "./Step3Confirm";

const baseProps = {
  courseLabel: "標準レベル1",
  unitName: "二次関数",
  fileName: "questions.csv",
  mode: "append" as const,
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
    expect(screen.getByText("標準レベル1")).toBeInTheDocument();
    expect(screen.getByText("二次関数")).toBeInTheDocument();
    expect(screen.getByText("questions.csv")).toBeInTheDocument();
    expect(screen.getByText(/5.*\/.*5/)).toBeInTheDocument();
  });

  it("追加モードでは上書き警告は表示されない", () => {
    render(<Step3Confirm {...baseProps} mode="append" />);
    expect(screen.queryByText(/取り消せません/)).not.toBeInTheDocument();
  });

  it("上書きモードでは強い警告が表示される", () => {
    render(<Step3Confirm {...baseProps} mode="overwrite" />);
    expect(screen.getByText(/取り消せません/)).toBeInTheDocument();
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
