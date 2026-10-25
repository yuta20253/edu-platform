"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useInterviewDetail } from "./hooks/useInterviewDetail";
import { Presenter } from "./Presenter";

type Props = {
  interviewId: number;
};

export const InterviewDetail = ({ interviewId }: Props) => {
  const {
    interview,
    messages,
    error,
    retry,
    schedule,
    complete,
    cancel,
    actionError,
    clearActionError,
    sendMessage,
    sendError,
  } = useInterviewDetail(interviewId);

  return (
    <AsyncBoundary data={interview} error={error} onRetry={retry}>
      {(loaded) => (
        <Presenter
          interview={loaded}
          messages={messages}
          onSchedule={schedule}
          onComplete={complete}
          onCancel={cancel}
          actionError={actionError}
          onClearActionError={clearActionError}
          onSendMessage={sendMessage}
          sendError={sendError}
        />
      )}
    </AsyncBoundary>
  );
};
