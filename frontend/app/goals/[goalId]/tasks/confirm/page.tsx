import { CreateTaskConfirm } from "@features/CreateTaskConfirm";

type CreateTaskConfirmPageProps = {
  params: Promise<{ goalId: string }>;
};

export default async function CreateTaskConfirmPage({ params }: CreateTaskConfirmPageProps) {
  const { goalId } = await params;
  return (<CreateTaskConfirm goalId={Number(goalId)} />);
}
