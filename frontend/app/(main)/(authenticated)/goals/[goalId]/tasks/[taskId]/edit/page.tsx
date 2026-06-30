import { EditTask } from "@/features/EditTask";

type Props = {
  params: Promise<{ goalId: string; taskId: string }>;
};

export default async function EditTaskPage({ params }: Props) {
  const { goalId, taskId } = await params;

  return <EditTask goalId={Number(goalId)} taskId={Number(taskId)} />;
}
