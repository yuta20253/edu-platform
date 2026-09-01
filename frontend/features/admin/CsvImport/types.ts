export type ImportMode = "append" | "overwrite";

export type WizardStep = 1 | 2 | 3 | 4;

export type CourseOption = {
  id: number;
  level_name: string;
  level_number: number;
};

export type UnitOption = {
  id: number;
  unit_name: string;
};

// 現状は "error" のみ。将来のwarning拡張を見込みユニオンで用意する
export type DryRunRowSeverity = "error" | "warning";

export type DryRunRow = {
  row_number: number;
  severity: DryRunRowSeverity;
  message: string;
  data: Record<string, string | null>;
};

export type DryRunResult = {
  total_count: number;
  valid_count: number;
  rows: DryRunRow[];
};

export type ImportAcceptedResult = {
  message: string;
};

export type CsvImportState = {
  step: WizardStep;

  courseId: number | null;
  unitId: number | null;
  isPreset: boolean;
  file: File | null;
  fileError: string | null;
  mode: ImportMode;

  dryRunLoading: boolean;
  dryRunResult: DryRunResult | null;
  dryRunError: string | null;

  submitting: boolean;
  submitError: string | null;
  importResult: ImportAcceptedResult | null;
};
