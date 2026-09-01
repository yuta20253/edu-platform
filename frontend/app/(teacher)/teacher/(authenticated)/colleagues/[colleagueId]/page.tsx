import { TeacherDetail } from "@/features/teacher/TeacherDetail";

type Props = {
  params: Promise<{ colleagueId: string }>;
};

export default async function ColleaguePage({ params }: Props) {
  const { colleagueId } = await params;
  return <TeacherDetail teacherId={Number(colleagueId)} />;
}
