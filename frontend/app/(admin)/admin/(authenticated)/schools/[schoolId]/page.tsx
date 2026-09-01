import { SchoolDetail } from "@/features/admin/SchoolDetail";

type Props = {
  params: Promise<{ schoolId: string }>;
};

const AdminSchoolDetailPage = async ({ params }: Props) => {
  const { schoolId } = await params;
  return <SchoolDetail schoolId={Number(schoolId)} />;
};

export default AdminSchoolDetailPage;
