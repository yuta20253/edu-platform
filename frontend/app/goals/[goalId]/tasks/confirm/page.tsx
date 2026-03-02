import { CreateTaskConfirm } from "@features/CreateTaskConfirm";

type CreateTaskConfirmPageProps = {
  params: { goalId: string };
};

export default async function CreateTaskConfirmPage({ params }: CreateTaskConfirmPageProps) {
  const goalId = Number(params.goalId);
  return (<CreateTaskConfirm goalId={goalId} />);
}
