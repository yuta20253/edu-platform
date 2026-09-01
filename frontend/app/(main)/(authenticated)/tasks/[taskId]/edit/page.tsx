import { EditTask } from "@/features/student/EditTask";

type Props = {
  params: Promise<{ taskId: string }>;
};

export default async function EditTaskPage({ params }: Props) {
  const { taskId } = await params;

  return <EditTask taskId={Number(taskId)} />;
}
