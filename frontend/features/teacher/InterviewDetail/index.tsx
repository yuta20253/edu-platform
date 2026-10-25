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

  // 最初の読み込みとその失敗だけ AsyncBoundary で画面全体に出す。
  // 操作の後の取り直しの失敗は、ダイアログに出した 409 などのエラーを消さないよう Presenter の中で出す
  return (
    <AsyncBoundary data={interview} error={!interview && error} onRetry={retry}>
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
          refreshError={error}
          onRetry={retry}
        />
      )}
    </AsyncBoundary>
  );
};
