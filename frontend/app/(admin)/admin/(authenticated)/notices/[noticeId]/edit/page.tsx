import { NoticeEdit } from "@/features/admin/NoticeEdit";
import { isNumericId } from "@/libs/server/routeParams";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ noticeId: string }>;
};

const AdminNoticeEditPage = async ({ params }: Props) => {
  const { noticeId } = await params;

  // noticeIdが数値でない場合はBFFへ問い合わせず404にする
  if (!isNumericId(noticeId)) {
    notFound();
  }

  return <NoticeEdit noticeId={Number(noticeId)} />;
};

export default AdminNoticeEditPage;
