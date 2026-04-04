import { AdminSchoolDetail } from "@/features/AdminSchoolDetail";

type Props = {
  params: Promise<{ schoolId: string }>;
};

export default async function AdminSchoolDetailPage({ params }: Props) {
  const { schoolId } = await params;
  return <AdminSchoolDetail schoolId={Number(schoolId)} />;
}
