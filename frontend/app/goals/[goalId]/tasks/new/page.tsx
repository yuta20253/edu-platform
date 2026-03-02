import { CreateTask } from "@/features/CreateTask";

type CreateTaskPageProps = {
  params: { goalId: string };
};

export default async function CreateTaskPage({ params }: CreateTaskPageProps) {
  const goalId = Number(params.goalId)
  return await (<CreateTask goalId={goalId} />);
}
