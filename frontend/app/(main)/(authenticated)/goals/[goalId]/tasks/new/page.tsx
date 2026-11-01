import { CreateTask } from "@/features/student/CreateTask";
import { isNumericId } from "@/libs/server/routeParams";
import { notFound } from "next/navigation";

type CreateTaskPageProps = {
  params: Promise<{ goalId: string }>;
  // 確認画面の「キャンセル」で戻ったときだけ付く。同じキーが繰り返されると配列になり、無いと undefined になる
  searchParams: Promise<{ draftTaskId?: string | string[] }>;
};

// 正の整数の文字列だけを ID として通す(isNumericId は "0" も通すが、ID は 1 から始まる)
const toPositiveId = (value: string | string[] | undefined): number | null => {
  if (typeof value !== "string" || !isNumericId(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
};

export default async function CreateTaskPage({
  params,
  searchParams,
}: CreateTaskPageProps) {
  const { goalId } = await params;
  const { draftTaskId } = await searchParams;

  const goalIdNumber = toPositiveId(goalId);
  // draftTaskId が無いときは新規作成(null)。あるのに不正なときは 404
  const draftTaskIdNumber =
    draftTaskId === undefined ? null : toPositiveId(draftTaskId);

  // 不正な ID では、バックエンドへ問い合わせず 404 にする
  if (
    goalIdNumber === null ||
    (draftTaskId !== undefined && draftTaskIdNumber === null)
  ) {
    notFound();
  }

  return <CreateTask goalId={goalIdNumber} draftTaskId={draftTaskIdNumber} />;
}
