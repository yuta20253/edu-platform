import { CreateTaskConfirm } from "@features/CreateTaskConfirm";

type CreateTaskConfirmPageProps = {
  params: Promise<{ goalId: string }>;
  searchParams: Promise<{ draft_task_id: string }>;
};

export default async function CreateTaskConfirmPage({
  params,
  searchParams,
}: CreateTaskConfirmPageProps) {
  const { goalId } = await params;
  const { draft_task_id } = await searchParams;
  return (
    <CreateTaskConfirm
      goalId={Number(goalId)}
      draftTaskId={Number(draft_task_id)}
    />
  );
}
