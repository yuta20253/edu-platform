import { UnitDetail } from "@/features/admin/UnitDetail";

type Props = {
  params: Promise<{ courseId: string; unitId: string }>;
};

export default async function AdminUnitDetailPage({ params }: Props) {
  const { courseId, unitId } = await params;

  return <UnitDetail courseId={Number(courseId)} unitId={Number(unitId)} />;
}
