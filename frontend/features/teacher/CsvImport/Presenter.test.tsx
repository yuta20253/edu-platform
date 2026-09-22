import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { CsvImportState } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const csvFile = (name = "students.csv") =>
  new File(["a"], name, { type: "text/csv" });

const buildState = (overrides: Partial<CsvImportState>): CsvImportState => ({
  step: 1,
  file: null,
  fileError: null,
  dryRunLoading: false,
  dryRunResult: null,
  dryRunError: null,
  submitting: false,
  submitError: null,
  importResult: null,
  ...overrides,
});

const baseProps = {
  handleFileSelect: vi.fn(),
  handleFileClear: vi.fn(),
  goNext: vi.fn(),
  goBack: vi.fn(),
  resetForNewImport: vi.fn(),
};

describe("Presenter", () => {
  it("step1のときStep1FileSelectの内容が表示される", () => {
    render(<Presenter state={buildState({ step: 1 })} {...baseProps} />);
    expect(
      screen.getByText(/ドラッグ&ドロップ、またはクリックして選択/),
    ).toBeInTheDocument();
  });

  it("step2のときStep2Previewの内容が表示される", () => {
    render(
      <Presenter
        state={buildState({
          step: 2,
          file: csvFile(),
          dryRunResult: { total_count: 1, valid_count: 1, rows: [] },
        })}
        {...baseProps}
      />,
    );
    expect(screen.getByText(/全1行中 1行が有効/)).toBeInTheDocument();
  });

  it("step3のときStep3Confirmの内容が表示される", () => {
    render(
      <Presenter
        state={buildState({
          step: 3,
          file: csvFile("students.csv"),
          dryRunResult: { total_count: 1, valid_count: 1, rows: [] },
        })}
        {...baseProps}
      />,
    );
    expect(screen.getByText("students.csv")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /実行/ })).toBeInTheDocument();
  });

  it("step4のときStep4Completeの内容が表示される", () => {
    render(
      <Presenter
        state={buildState({
          step: 4,
          dryRunResult: { total_count: 3, valid_count: 3, rows: [] },
          importResult: { message: "インポートを開始しました" },
        })}
        {...baseProps}
      />,
    );
    expect(screen.getByText("インポートを開始しました")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /生徒管理/ })).toHaveAttribute(
      "href",
      "/teacher/students",
    );
  });

  it("step1で次へをクリックするとgoNextが呼ばれる", () => {
    const goNext = vi.fn();
    render(
      <Presenter
        state={buildState({ step: 1, file: csvFile() })}
        {...baseProps}
        goNext={goNext}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(goNext).toHaveBeenCalled();
  });

  it("step1でdryRunLoading中は次へボタンが無効になる（連打によるレースコンディション防止）", () => {
    render(
      <Presenter
        state={buildState({
          step: 1,
          file: csvFile(),
          dryRunLoading: true,
        })}
        {...baseProps}
      />,
    );
    expect(screen.getByRole("button", { name: "次へ" })).toBeDisabled();
  });

  it("step2で戻るをクリックするとgoBackが呼ばれる", () => {
    const goBack = vi.fn();
    render(
      <Presenter
        state={buildState({
          step: 2,
          dryRunResult: { total_count: 1, valid_count: 1, rows: [] },
        })}
        {...baseProps}
        goBack={goBack}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(goBack).toHaveBeenCalled();
  });
});
