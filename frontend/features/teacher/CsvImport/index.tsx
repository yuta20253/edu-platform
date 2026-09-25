"use client";

import { Presenter } from "./Presenter";
import { useCsvImport } from "./hooks/useCsvImport";

export const CsvImport = () => {
  const wizard = useCsvImport();

  return (
    <Presenter
      state={wizard.state}
      handleFileSelect={wizard.handleFileSelect}
      handleFileClear={wizard.handleFileClear}
      goNext={wizard.goNext}
      goBack={wizard.goBack}
      resetForNewImport={wizard.resetForNewImport}
    />
  );
};
