import { ImportHistoryDetail } from "@/features/admin/ImportHistoryDetail";

type Props = { params: Promise<{ id: string }> };

const ImportHistoryDetailPage = async ({ params }: Props) => {
  const { id } = await params;

  return <ImportHistoryDetail historyId={Number(id)} />;
};

export default ImportHistoryDetailPage;
