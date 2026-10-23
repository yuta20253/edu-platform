import { AnnouncementEditor } from "@/features/teacher/AnnouncementEditor";
import { isNumericId } from "@/libs/server/routeParams";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ announcementId: string }>;
};

export default async function TeacherAnnouncementEditPage({ params }: Props) {
  const { announcementId } = await params;

  // announcementIdが数値でない場合はBFFへ問い合わせず404にする
  if (!isNumericId(announcementId)) {
    notFound();
  }

  return <AnnouncementEditor announcementId={Number(announcementId)} />;
}
