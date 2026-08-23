import { AnnouncementDetail } from "@/features/AnnouncementDetail";

type Props = {
  params: Promise<{ announcementId: string }>;
};

export default async function AnnouncementDetailPage({ params }: Props) {
  const { announcementId } = await params;
  return <AnnouncementDetail announcementId={Number(announcementId)} />;
}
