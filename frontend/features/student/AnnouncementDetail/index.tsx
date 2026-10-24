"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Announcement } from "@/types/announcement/announcement";
import { Presenter } from "./Presenter";

type Props = {
  announcementId: number;
};

export const AnnouncementDetail = ({ announcementId }: Props) => {
  const { data, error, refetch } = useApiQuery<Announcement>(
    `/api/student/announcements/${announcementId}`,
  );

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(announcement) => <Presenter announcement={announcement} />}
    </AsyncBoundary>
  );
};
