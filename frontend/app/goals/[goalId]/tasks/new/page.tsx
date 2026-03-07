import { CreateTask } from "@/features/CreateTask";

type CreateTaskPageProps = {
  params: Promise<{ goalId: string }>;
};

export default async function CreateTaskPage({ params }: CreateTaskPageProps) {
  const { goalId } = await params;
  return await (<CreateTask goalId={Number(goalId)} />);
}
