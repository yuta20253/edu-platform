import { InterviewDetail } from "@/features/teacher/InterviewDetail";
import { isNumericId } from "@/libs/server/routeParams";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ interviewId: string }>;
};

export default async function InterviewDetailPage({ params }: Props) {
  const { interviewId } = await params;

  // interviewIdが数値でない場合はBFFへ問い合わせず404にする
  if (!isNumericId(interviewId)) {
    notFound();
  }

  // 別の面談へ移ったときに前の面談の内容やダイアログが残らないよう作り直す
  return (
    <InterviewDetail key={interviewId} interviewId={Number(interviewId)} />
  );
}
