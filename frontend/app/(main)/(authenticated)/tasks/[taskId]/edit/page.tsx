import { EditTask } from "@/features/EditTask";

type Props = {
  params: Promise<{ taskId: string }>;
};

export default async function EditTaskPage({ params }: Props) {
  const { taskId } = await params;

  return <EditTask taskId={Number(taskId)} />;
}
