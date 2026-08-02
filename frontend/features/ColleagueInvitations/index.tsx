"use client";

import { Presenter } from "./Presenter";
import { useColleagueInvitations } from "./hooks";

export const ColleagueInvitations = () => {
  const { data, loading, error, refetch } = useColleagueInvitations();

  return (
    <Presenter
      teachers={data ?? []}
      loading={loading}
      error={error}
      refetch={refetch}
    />
  );
};
