import { CreateTaskConfirm } from "@/features/student/CreateTaskConfirm";
import { isNumericId } from "@/libs/server/routeParams";
import { notFound } from "next/navigation";

type CreateTaskConfirmPageProps = {
  params: Promise<{ goalId: string }>;
  // 同じキーが繰り返されると配列になり、無いと undefined になる
  searchParams: Promise<{ draft_task_id?: string | string[] }>;
};

// 正の整数の文字列だけを ID として通す(isNumericId は "0" も通すが、ID は 1 から始まる)
const toPositiveId = (value: string | string[] | undefined): number | null => {
  if (typeof value !== "string" || !isNumericId(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
};

export default async function CreateTaskConfirmPage({
  params,
  searchParams,
}: CreateTaskConfirmPageProps) {
  const { goalId } = await params;
  const { draft_task_id } = await searchParams;

  const goalIdNumber = toPositiveId(goalId);
  const draftTaskIdNumber = toPositiveId(draft_task_id);

  // 不正な ID では、バックエンドへ問い合わせず 404 にする
  if (goalIdNumber === null || draftTaskIdNumber === null) {
    notFound();
  }

  return (
    <CreateTaskConfirm goalId={goalIdNumber} draftTaskId={draftTaskIdNumber} />
  );
}
