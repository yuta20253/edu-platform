export type WizardStep = 1 | 2 | 3 | 4;

export type DryRunRowSeverity = "error";

export type DryRunRow = {
  row_number: number;
  severity: DryRunRowSeverity;
  message: string;
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

  file: File | null;
  fileError: string | null;

  dryRunLoading: boolean;
  dryRunResult: DryRunResult | null;
  dryRunError: string | null;

  submitting: boolean;
  submitError: string | null;
  importResult: ImportAcceptedResult | null;
};
