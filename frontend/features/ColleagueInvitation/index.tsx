"use client";

import { useColleagueInvitations } from "./hooks/useColleagueInvitations";
import { useSendInvites } from "./hooks/useSendInvites";
import { Presenter } from "./Presenter";

export const ColleagueInvitation = () => {
  const { data, loading, error, refetch } = useColleagueInvitations();

  const teachers = data ?? [];

  const {
    selectedTeacherIds,
    submitting,
    submitError,
    successMessage,
    handleToggleTeacher,
    handleToggleAll,
    handleSendInvites,
    allSelected,
  } = useSendInvites({
    teachers,
    refetch,
  });

  return (
    <Presenter
      teachers={teachers}
      loading={loading}
      error={error}
      selectedTeacherIds={selectedTeacherIds}
      submitting={submitting}
      submitError={submitError}
      successMessage={successMessage}
      allSelected={allSelected}
      onToggleTeacher={handleToggleTeacher}
      onToggleAll={handleToggleAll}
      onSendInvites={handleSendInvites}
    />
  );
};
