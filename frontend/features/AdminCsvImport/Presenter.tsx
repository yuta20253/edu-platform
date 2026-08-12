"use client";

import { Box, Typography } from "@mui/material";
import { colors } from "@/app/theme/colors";
import { buildCourseLabel } from "@/libs/domain/course/courseLabel";
import { Step1FileSelect } from "./steps/Step1FileSelect";
import { Step2Preview } from "./steps/Step2Preview";
import { Step3Confirm } from "./steps/Step3Confirm";
import { Step4Complete } from "./steps/Step4Complete";
import type {
  CourseOption,
  CsvImportState,
  ImportMode,
  UnitOption,
} from "./types";

type Props = {
  state: CsvImportState;
  courses: CourseOption[];
  coursesLoading: boolean;
  units: UnitOption[];
  unitsLoading: boolean;
  handleCourseChange: (courseId: number) => void;
  handleUnitChange: (unitId: number) => void;
  handleFileSelect: (file: File) => void;
  handleFileClear: () => void;
  handleModeChange: (mode: ImportMode) => void;
  goNext: () => void | Promise<void>;
  goBack: () => void;
};

const STEP_LABELS: Record<CsvImportState["step"], string> = {
  1: "Step 1: ファイル選択",
  2: "Step 2: プレビュー・検証",
  3: "Step 3: 確認",
  4: "Step 4: 完了",
};

export const Presenter = ({
  state,
  courses,
  coursesLoading,
  units,
  unitsLoading,
  handleCourseChange,
  handleUnitChange,
  handleFileSelect,
  handleFileClear,
  handleModeChange,
  goNext,
  goBack,
}: Props) => {
  const course = courses.find((c) => c.id === state.courseId);
  const unit = units.find((u) => u.id === state.unitId);

  const content = (() => {
    if (state.step === 1) {
      return (
        <Step1FileSelect
          courses={courses}
          coursesLoading={coursesLoading}
          units={units}
          unitsLoading={unitsLoading}
          courseId={state.courseId}
          unitId={state.unitId}
          isPreset={state.isPreset}
          onCourseChange={handleCourseChange}
          onUnitChange={handleUnitChange}
          file={state.file}
          fileError={state.fileError}
          onFileSelect={handleFileSelect}
          onFileClear={handleFileClear}
          mode={state.mode}
          onModeChange={handleModeChange}
          onNext={goNext}
          canProceed={
            state.courseId != null &&
            state.unitId != null &&
            state.file != null &&
            !state.fileError
          }
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
          courseLabel={
            course ? buildCourseLabel(course) : `講座 ${state.courseId}`
          }
          unitName={unit ? unit.unit_name : `単元 ${state.unitId}`}
          fileName={state.file?.name ?? ""}
          mode={state.mode}
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
        courseId={state.courseId ?? 0}
        unitId={state.unitId ?? 0}
        message={state.importResult?.message ?? ""}
        validCount={state.dryRunResult?.valid_count ?? 0}
        totalCount={state.dryRunResult?.total_count ?? 0}
      />
    );
  })();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: colors.text.primary }}
        >
          CSVインポート
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text.muted }}>
          {STEP_LABELS[state.step]}
        </Typography>
      </Box>
      <Box sx={{ maxWidth: 720 }}>{content}</Box>
    </Box>
  );
};
