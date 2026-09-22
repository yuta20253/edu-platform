import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Step1FileSelect } from "./Step1FileSelect";

const csvFile = (name = "students.csv") =>
  new File(["a"], name, { type: "text/csv" });

const baseProps = {
  file: null as File | null,
  fileError: null as string | null,
  onFileSelect: vi.fn(),
  onFileClear: vi.fn(),
  onNext: vi.fn(),
  canProceed: false,
  submitting: false,
};

describe("Step1FileSelect", () => {
  it("ファイルドロップでonFileSelectが呼ばれる", () => {
    const onFileSelect = vi.fn();
    render(<Step1FileSelect {...baseProps} onFileSelect={onFileSelect} />);
    const file = csvFile();
    const dropzone = screen.getByTestId("csv-dropzone");

    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it("fileErrorがあるとAlertが表示される", () => {
    render(
      <Step1FileSelect
        {...baseProps}
        fileError="CSVファイル（.csv）のみアップロード可能です"
      />,
    );
    expect(
      screen.getByText("CSVファイル（.csv）のみアップロード可能です"),
    ).toBeInTheDocument();
  });

  it("選択済みファイルがあればファイル名と削除ボタンが表示される", () => {
    const onFileClear = vi.fn();
    render(
      <Step1FileSelect
        {...baseProps}
        file={csvFile("my_students.csv")}
        onFileClear={onFileClear}
      />,
    );
    expect(screen.getByText("my_students.csv")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    expect(onFileClear).toHaveBeenCalled();
  });

  it("学年に入力可能な値の一覧が表示される", () => {
    render(<Step1FileSelect {...baseProps} />);
    expect(screen.getByText(/高１生、高２生、高３生/)).toBeInTheDocument();
  });

  it("テンプレートDLリンクが正しいhrefとdownload属性を持つ", () => {
    render(<Step1FileSelect {...baseProps} />);
    const link = screen.getByRole("link", { name: /テンプレート/ });
    expect(link).toHaveAttribute("href", "/templates/students_template.csv");
    expect(link).toHaveAttribute("download");
  });

  it("canProceedがfalseなら次へボタンは無効", () => {
    render(<Step1FileSelect {...baseProps} canProceed={false} />);
    expect(screen.getByRole("button", { name: "次へ" })).toBeDisabled();
  });

  it("canProceedがtrueなら次へボタンは有効でクリックするとonNextが呼ばれる", () => {
    const onNext = vi.fn();
    render(<Step1FileSelect {...baseProps} canProceed onNext={onNext} />);
    const button = screen.getByRole("button", { name: "次へ" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onNext).toHaveBeenCalled();
  });

  it("submitting中はcanProceedがtrueでも次へボタンが無効になる", () => {
    render(<Step1FileSelect {...baseProps} canProceed submitting />);
    expect(screen.getByRole("button", { name: "次へ" })).toBeDisabled();
  });

  it("submitting中は次へボタンにローディング表示が出る", () => {
    render(<Step1FileSelect {...baseProps} canProceed submitting />);
    const button = screen.getByRole("button", { name: "次へ" });
    expect(button.querySelector(".MuiCircularProgress-root")).not.toBeNull();
  });
});
