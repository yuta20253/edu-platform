import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { CourseOption, CsvImportState, UnitOption } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const courses: CourseOption[] = [
  {
    id: 1,
    level_name: "標準",
    level_number: 1,
  },
];
const units: UnitOption[] = [{ id: 11, unit_name: "二次関数" }];

const csvFile = (name = "questions.csv") =>
  new File(["a"], name, { type: "text/csv" });

const buildState = (overrides: Partial<CsvImportState>): CsvImportState => ({
  step: 1,
  courseId: 1,
  unitId: 11,
  isPreset: true,
  file: null,
  fileError: null,
  mode: "append",
  dryRunLoading: false,
  dryRunResult: null,
  dryRunError: null,
  submitting: false,
  submitError: null,
  importResult: null,
  ...overrides,
});

const baseProps = {
  courses,
  coursesLoading: false,
  units,
  unitsLoading: false,
  handleCourseChange: vi.fn(),
  handleUnitChange: vi.fn(),
  handleFileSelect: vi.fn(),
  handleFileClear: vi.fn(),
  handleModeChange: vi.fn(),
  goNext: vi.fn(),
  goBack: vi.fn(),
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
          file: csvFile("questions.csv"),
          dryRunResult: { total_count: 1, valid_count: 1, rows: [] },
        })}
        {...baseProps}
      />,
    );
    expect(screen.getByText("questions.csv")).toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: /単元詳細/ })).toHaveAttribute(
      "href",
      "/admin/courses/1/units/11",
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
