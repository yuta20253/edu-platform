import { CreateTask } from "@/features/CreateTask";

type CreateTaskPageProps = {
  params: { goalId: string };
};

export default async function CreateTaskPage({ params }: CreateTaskPageProps) {
  return await (<CreateTask goalId={Number(params.goalId)} />);
}
