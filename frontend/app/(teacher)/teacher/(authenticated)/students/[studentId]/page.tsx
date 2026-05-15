import { StudentDetail } from "@/features/StudentDetail";

type Props = {
  params: Promise<{ studentId: string }>;
};

export default async function StudentPage({ params }: Props) {
  const { studentId } = await params;
  return <StudentDetail studentId={Number(studentId)} />;
}
