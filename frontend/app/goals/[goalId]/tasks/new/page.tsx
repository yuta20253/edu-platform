import { CreateTask } from "@/features/CreateTask";

type CreateTaskPageProps = {
  params: Promise<{ goalId: string }>;
  searchParams: Promise<{ draftTaskId: string }>
};

export default async function CreateTaskPage({ params, searchParams }: CreateTaskPageProps) {
  const { goalId } = await params;
  const { draftTaskId } = await searchParams;
  return await (<CreateTask goalId={Number(goalId)} draftTaskId={Number(draftTaskId)} />);
}
