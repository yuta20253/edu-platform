import { CreateTask } from "@/features/CreateTask";

type CreateTaskPageProps = {
  params: { goalId: string };
}

export default function CreateTaskPage( { params }: CreateTaskPageProps) {
  return <CreateTask goalId={Number(params.goalId)} />;
}
