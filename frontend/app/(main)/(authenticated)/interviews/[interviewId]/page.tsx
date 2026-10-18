import { InterviewDetail } from "@/features/student/InterviewDetail";

type Props = {
  params: Promise<{ interviewId: string }>;
};

export default async function InterviewDetailPage({ params }: Props) {
  const { interviewId } = await params;
  return <InterviewDetail interviewId={interviewId} />;
}
