"use client";

import { useSearchParams } from "next/navigation";
import { AdminCsvImport } from "@/features/AdminCsvImport";

const parsePresetId = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export default function AdminCsvImportPage() {
  const searchParams = useSearchParams();

  return (
    <AdminCsvImport
      presetCourseId={parsePresetId(searchParams.get("courseId"))}
      presetUnitId={parsePresetId(searchParams.get("unitId"))}
    />
  );
}
