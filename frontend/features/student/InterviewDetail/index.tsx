"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useInterviewDetail } from "./hooks/useInterviewDetail";
import { Presenter } from "./Presenter";

type Props = {
  interviewId: string;
};

export const InterviewDetail = ({ interviewId }: Props) => {
  const {
    interview,
    messages,
    error,
    refetch,
    sendMessage,
    sendError,
    cancel,
    cancelError,
    clearCancelError,
  } = useInterviewDetail(interviewId);

  return (
    <AsyncBoundary data={interview} error={error} onRetry={refetch}>
      {(loaded) => (
        <Presenter
          interview={loaded}
          messages={messages}
          onSendMessage={sendMessage}
          sendError={sendError}
          onCancel={cancel}
          cancelError={cancelError}
          onClearCancelError={clearCancelError}
        />
      )}
    </AsyncBoundary>
  );
};
