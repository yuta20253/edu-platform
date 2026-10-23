"use client";

import { useState } from "react";
import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useAnnouncements } from "./hooks/useAnnouncements";
import { Presenter } from "./Presenter";
import { AnnouncementTab } from "./types";

type ListProps = {
  tab: AnnouncementTab;
  onTabChange: (tab: AnnouncementTab) => void;
};

const AnnouncementList = ({ tab, onTabChange }: ListProps) => {
  const [page, setPage] = useState(1);
  const { data, error, refetch } = useAnnouncements(tab, page);

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(result) => (
        <Presenter
          tab={tab}
          data={result}
          page={page}
          onTabChange={onTabChange}
          onPageChange={setPage}
        />
      )}
    </AsyncBoundary>
  );
};

export const Announcements = () => {
  const [tab, setTab] = useState<AnnouncementTab>("received");

  // タブごとに作り直し、ページも1ページ目に戻す(タブをまたいで data を引き継がない)
  return <AnnouncementList key={tab} tab={tab} onTabChange={setTab} />;
};
