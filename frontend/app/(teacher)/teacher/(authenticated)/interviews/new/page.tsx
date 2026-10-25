import { CreateInterview } from "@/features/teacher/CreateInterview";

type Props = {
  searchParams: Promise<{ student_id?: string }>;
};

// 生徒詳細から遷移したときは ?student_id= の生徒を選択しておく
export default async function NewInterviewPage({ searchParams }: Props) {
  const { student_id } = await searchParams;
  const initialStudentId =
    student_id && /^\d+$/.test(student_id) ? Number(student_id) : undefined;

  return <CreateInterview initialStudentId={initialStudentId} />;
}
