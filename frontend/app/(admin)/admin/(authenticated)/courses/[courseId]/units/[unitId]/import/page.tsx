import { AdminCsvImport } from "@/features/AdminCsvImport";

type Props = {
  params: Promise<{ courseId: string; unitId: string }>;
};

export default async function AdminCsvImportFromUnitPage({ params }: Props) {
  const { courseId, unitId } = await params;

  return (
    <AdminCsvImport
      presetCourseId={Number(courseId)}
      presetUnitId={Number(unitId)}
    />
  );
}
