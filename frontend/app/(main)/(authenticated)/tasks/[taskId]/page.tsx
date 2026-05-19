import { TaskDetail } from "@/features/TaskDetail";

type Props = {
  params: Promise<{ taskId: string }>;
};

export default async function TaskDetailPage({ params }: Props) {
  const { taskId } = await params;

  return <TaskDetail taskId={Number(taskId)} />;
}
