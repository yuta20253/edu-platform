import { AdminUnitDetail } from "@/features/AdminUnitDetail";

type Props = {
  params: Promise<{ courseId: string; unitId: string }>;
};

export default async function AdminUnitDetailPage({ params }: Props) {
  const { courseId, unitId } = await params;

  return (
    <AdminUnitDetail courseId={Number(courseId)} unitId={Number(unitId)} />
  );
}
