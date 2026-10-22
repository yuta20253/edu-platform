"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useAnnouncement } from "./hooks/useAnnouncement";
import { Presenter } from "./Presenter";

type Props = {
  announcementId: number;
};

export const AnnouncementDetail = ({ announcementId }: Props) => {
  const { data, error, refetch } = useAnnouncement(announcementId);

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(announcement) => <Presenter announcement={announcement} />}
    </AsyncBoundary>
  );
};
