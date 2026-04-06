import { AdminSchoolDetail } from "@/features/AdminSchoolDetail";

type Props = {
  params: Promise<{ schoolId: string }>;
};

const AdminSchoolDetailPage = async ({ params }: Props) => {
  const { schoolId } = await params;
  return <AdminSchoolDetail schoolId={Number(schoolId)} />;
};

export default AdminSchoolDetailPage;
