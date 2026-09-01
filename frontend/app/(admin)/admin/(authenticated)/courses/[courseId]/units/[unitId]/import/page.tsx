import { CsvImport } from "@/features/admin/CsvImport";
import { parsePresetId } from "@/features/admin/CsvImport/parsePresetId";

type Props = {
  params: Promise<{ courseId: string; unitId: string }>;
};

export default async function CsvImportFromUnitPage({ params }: Props) {
  const { courseId, unitId } = await params;

  return (
    <CsvImport
      presetCourseId={parsePresetId(courseId)}
      presetUnitId={parsePresetId(unitId)}
    />
  );
}
