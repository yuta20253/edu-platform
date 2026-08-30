"use client";

import { useSearchParams } from "next/navigation";
import { AdminCsvImport } from "@/features/AdminCsvImport";
import { parsePresetId } from "@/features/AdminCsvImport/parsePresetId";

export default function AdminCsvImportPage() {
  const searchParams = useSearchParams();

  return (
    <AdminCsvImport
      presetCourseId={parsePresetId(searchParams.get("courseId"))}
      presetUnitId={parsePresetId(searchParams.get("unitId"))}
    />
  );
}
