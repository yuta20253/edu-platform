import { CreateTaskConfirm } from "@features/CreateTaskConfirm";

type CreateTaskConfirmPageProps = {
  params: { goalId: string };
};

export default async function CreateTaskConfirmPage({ params }: CreateTaskConfirmPageProps) {
  return (<CreateTaskConfirm goldId={params.goalId} />);
}
