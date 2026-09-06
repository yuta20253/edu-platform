import { ImportHistoryDetail } from "@/features/admin/ImportHistoryDetail";
import { isNumericId } from "@/libs/server/routeParams";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

const ImportHistoryDetailPage = async ({ params }: Props) => {
  const { id } = await params;

  // id が数値でない場合はBFFへ問い合わせず404にする
  if (!isNumericId(id)) {
    notFound();
  }

  return <ImportHistoryDetail historyId={Number(id)} />;
};

export default ImportHistoryDetailPage;
