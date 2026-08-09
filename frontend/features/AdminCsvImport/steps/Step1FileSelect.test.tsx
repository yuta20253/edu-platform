import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Step1FileSelect } from "./Step1FileSelect";
import type { CourseOption, UnitOption } from "../types";

const courses: CourseOption[] = [
  {
    id: 1,
    subject: { id: 1, name: "数学" },
    level_name: "標準",
    level_number: 1,
  },
];
const units: UnitOption[] = [{ id: 11, unit_name: "二次関数" }];

const csvFile = (name = "questions.csv") =>
  new File(["a"], name, { type: "text/csv" });

const baseProps = {
  courses,
  coursesLoading: false,
  units,
  unitsLoading: false,
  courseId: null as number | null,
  unitId: null as number | null,
  isPreset: false,
  onCourseChange: vi.fn(),
  onUnitChange: vi.fn(),
  file: null as File | null,
  fileError: null as string | null,
  onFileSelect: vi.fn(),
  onFileClear: vi.fn(),
  mode: "append" as const,
  onModeChange: vi.fn(),
  onNext: vi.fn(),
  canProceed: false,
};

describe("Step1FileSelect", () => {
  it("プリセットがない場合は講座・単元のSelectが表示される", () => {
    render(<Step1FileSelect {...baseProps} />);
    expect(screen.getByLabelText("講座")).toBeInTheDocument();
    expect(screen.getByLabelText("単元")).toBeInTheDocument();
  });

  it("プリセットがある場合は選択UIをスキップし読み取り表示になる", () => {
    render(
      <Step1FileSelect {...baseProps} isPreset courseId={1} unitId={11} />,
    );
    expect(screen.queryByLabelText("講座")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("単元")).not.toBeInTheDocument();
  });

  it("courseIdが未選択のとき単元Selectは無効", () => {
    render(<Step1FileSelect {...baseProps} />);
    expect(screen.getByLabelText("単元")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

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
        file={csvFile("my_questions.csv")}
        onFileClear={onFileClear}
      />,
    );
    expect(screen.getByText("my_questions.csv")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    expect(onFileClear).toHaveBeenCalled();
  });

  it("上書きモードを選択すると警告Alertが表示される", () => {
    render(<Step1FileSelect {...baseProps} mode="overwrite" />);
    expect(
      screen.getByText(/既存の問題を全て置き換えます/),
    ).toBeInTheDocument();
  });

  it("追加モードでは上書き警告は表示されない", () => {
    render(<Step1FileSelect {...baseProps} mode="append" />);
    expect(
      screen.queryByText(/既存の問題を全て置き換えます/),
    ).not.toBeInTheDocument();
  });

  it("モードラジオを変更するとonModeChangeが呼ばれる", () => {
    const onModeChange = vi.fn();
    render(<Step1FileSelect {...baseProps} onModeChange={onModeChange} />);
    fireEvent.click(screen.getByLabelText("上書き"));
    expect(onModeChange).toHaveBeenCalledWith("overwrite");
  });

  it("テンプレートDLリンクが正しいhrefとdownload属性を持つ", () => {
    render(<Step1FileSelect {...baseProps} />);
    const link = screen.getByRole("link", { name: /テンプレート/ });
    expect(link).toHaveAttribute("href", "/api/admin/csv_template/questions");
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
});
