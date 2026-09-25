import { AnnouncementDetail } from "@/features/teacher/AnnouncementDetail";

type Props = {
  params: Promise<{ announcementId: string }>;
};

export default async function AnnouncementPage({ params }: Props) {
  const { announcementId } = await params;
  return <AnnouncementDetail announcementId={Number(announcementId)} />;
}
