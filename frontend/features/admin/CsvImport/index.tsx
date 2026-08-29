"use client";

import { Presenter } from "./Presenter";
import { useCsvImport } from "./hooks/useCsvImport";
import { useFetchCourseOptions } from "./hooks/useFetchCourseOptions";
import { useFetchUnitOptions } from "./hooks/useFetchUnitOptions";

type Props = {
  presetCourseId: number | null;
  presetUnitId: number | null;
};

export const CsvImport = ({ presetCourseId, presetUnitId }: Props) => {
  const wizard = useCsvImport({ presetCourseId, presetUnitId });
  const { courses, coursesLoading } = useFetchCourseOptions();
  const { units, unitsLoading } = useFetchUnitOptions(wizard.state.courseId);

  return (
    <Presenter
      state={wizard.state}
      courses={courses}
      coursesLoading={coursesLoading}
      units={units}
      unitsLoading={unitsLoading}
      handleCourseChange={wizard.handleCourseChange}
      handleUnitChange={wizard.handleUnitChange}
      handleFileSelect={wizard.handleFileSelect}
      handleFileClear={wizard.handleFileClear}
      handleModeChange={wizard.handleModeChange}
      goNext={wizard.goNext}
      goBack={wizard.goBack}
    />
  );
};
