import { NoticeEditor } from "@/features/admin/NoticeEditor";

type Props = {
  params: Promise<{ noticeId: string }>;
};

const AdminNoticeEditPage = async ({ params }: Props) => {
  const { noticeId } = await params;

  return <NoticeEditor noticeId={Number(noticeId)} />;
};

export default AdminNoticeEditPage;
