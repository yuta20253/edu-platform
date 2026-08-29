import { AdminCsvImport } from "@/features/AdminCsvImport";
import { parsePresetId } from "@/features/AdminCsvImport/parsePresetId";

type Props = {
  params: Promise<{ courseId: string; unitId: string }>;
};

export default async function AdminCsvImportFromUnitPage({ params }: Props) {
  const { courseId, unitId } = await params;

  return (
    <AdminCsvImport
      presetCourseId={parsePresetId(courseId)}
      presetUnitId={parsePresetId(unitId)}
    />
  );
}
