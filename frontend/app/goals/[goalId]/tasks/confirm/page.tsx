import { CreateTaskConfirm } from "@features/CreateTaskConfirm";

type CreateTaskConfirmPageProps = {
  params: { goalId: number };
};

export default async function CreateTaskConfirmPage({ params }: CreateTaskConfirmPageProps) {
  return (<CreateTaskConfirm goalId={params.goalId} />);
}
