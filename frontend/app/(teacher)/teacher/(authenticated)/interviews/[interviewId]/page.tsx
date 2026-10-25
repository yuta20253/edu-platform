import { InterviewDetail } from "@/features/teacher/InterviewDetail";

type Props = {
  params: Promise<{ interviewId: string }>;
};

export default async function InterviewDetailPage({ params }: Props) {
  const { interviewId } = await params;
  // 別の面談へ移ったときに前の面談の内容やダイアログが残らないよう作り直す
  return (
    <InterviewDetail key={interviewId} interviewId={Number(interviewId)} />
  );
}
