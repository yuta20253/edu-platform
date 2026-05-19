import { TaskDetail } from "@/features/TaskDetail";

type Props = {
  params: Promise<{ goalId: string; taskId: string }>;
};

export default async function TaskDetailPage({ params }: Props) {
  const { goalId, taskId } = await params;

  return <TaskDetail taskId={Number(taskId)} goalId={Number(goalId)} />;
}
