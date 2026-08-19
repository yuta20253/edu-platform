import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Step2Preview } from "./Step2Preview";
import type { DryRunResult } from "../types";

const baseProps = {
  loading: false,
  result: null as DryRunResult | null,
  error: null as string | null,
  onBack: vi.fn(),
  onNext: vi.fn(),
};

describe("Step2Preview", () => {
  it("loading中はローディング表示のみでテーブルは出さない", () => {
    render(<Step2Preview {...baseProps} loading />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("errorがあるとAlertのみ表示されテーブルは出さない", () => {
    render(
      <Step2Preview
        {...baseProps}
        error="CSVファイルのみアップロード可能です"
      />,
    );
    expect(
      screen.getByText("CSVファイルのみアップロード可能です"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "次へ" })).toBeDisabled();
  });

  it("エラー行がない場合はサマリとsuccess表示、次へが活性", () => {
    const result: DryRunResult = { total_count: 5, valid_count: 5, rows: [] };
    render(<Step2Preview {...baseProps} result={result} />);
    expect(screen.getByText(/全5行中 5行が有効/)).toBeInTheDocument();
    expect(screen.getByText("エラーはありません")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "次へ" })).toBeEnabled();
  });

  it("エラー行がある場合は警告とテーブルが表示され、次へは無効", () => {
    const result: DryRunResult = {
      total_count: 3,
      valid_count: 2,
      rows: [
        {
          row_number: 3,
          severity: "error",
          message: "問題文が空です",
          data: {},
        },
      ],
    };
    render(<Step2Preview {...baseProps} result={result} />);
    expect(screen.getByText(/エラーが1件あります/)).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("問題文が空です")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "次へ" })).toBeDisabled();
  });

  it("戻るボタンをクリックするとonBackが呼ばれる", () => {
    const onBack = vi.fn();
    render(<Step2Preview {...baseProps} onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("エラー行なしで次へをクリックするとonNextが呼ばれる", () => {
    const onNext = vi.fn();
    const result: DryRunResult = { total_count: 1, valid_count: 1, rows: [] };
    render(<Step2Preview {...baseProps} result={result} onNext={onNext} />);
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(onNext).toHaveBeenCalled();
  });
});
