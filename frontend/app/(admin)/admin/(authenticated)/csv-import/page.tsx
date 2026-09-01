"use client";

import { useSearchParams } from "next/navigation";
import { CsvImport } from "@/features/admin/CsvImport";
import { parsePresetId } from "@/features/admin/CsvImport/parsePresetId";

export default function CsvImportPage() {
  const searchParams = useSearchParams();

  return (
    <CsvImport
      presetCourseId={parsePresetId(searchParams.get("courseId"))}
      presetUnitId={parsePresetId(searchParams.get("unitId"))}
    />
  );
}
