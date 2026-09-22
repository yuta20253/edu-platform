"use client";

import { Box, Typography } from "@mui/material";
import { colors } from "@/app/theme/colors";
import { Step1FileSelect } from "./steps/Step1FileSelect";
import { Step2Preview } from "./steps/Step2Preview";
import { Step3Confirm } from "./steps/Step3Confirm";
import { Step4Complete } from "./steps/Step4Complete";
import { STEP_LABELS } from "./constants";
import type { CsvImportState } from "./types";

type Props = {
  state: CsvImportState;
  handleFileSelect: (file: File) => void;
  handleFileClear: () => void;
  goNext: () => void | Promise<void>;
  goBack: () => void;
  resetForNewImport: () => void;
};

export const Presenter = ({
  state,
  handleFileSelect,
  handleFileClear,
  goNext,
  goBack,
  resetForNewImport,
}: Props) => {
  const renderStepContent = () => {
    if (state.step === 1) {
      return (
        <Step1FileSelect
          file={state.file}
          fileError={state.fileError}
          onFileSelect={handleFileSelect}
          onFileClear={handleFileClear}
          onNext={goNext}
          submitting={state.dryRunLoading}
          canProceed={state.file != null && !state.fileError}
        />
      );
    }

    if (state.step === 2) {
      return (
        <Step2Preview
          loading={state.dryRunLoading}
          result={state.dryRunResult}
          error={state.dryRunError}
          onBack={goBack}
          onNext={goNext}
        />
      );
    }

    if (state.step === 3) {
      return (
        <Step3Confirm
          fileName={state.file?.name ?? ""}
          validCount={state.dryRunResult?.valid_count ?? 0}
          totalCount={state.dryRunResult?.total_count ?? 0}
          submitting={state.submitting}
          submitError={state.submitError}
          onBack={goBack}
          onSubmit={goNext}
        />
      );
    }

    return (
      <Step4Complete
        message={state.importResult?.message ?? ""}
        validCount={state.dryRunResult?.valid_count ?? 0}
        totalCount={state.dryRunResult?.total_count ?? 0}
        onReset={resetForNewImport}
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: colors.text.primary }}
          >
            生徒CSVインポート
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.muted }}>
            {STEP_LABELS[state.step]}
          </Typography>
        </Box>
        {renderStepContent()}
      </Box>
    </Box>
  );
};
