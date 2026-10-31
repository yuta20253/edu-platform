"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useSchoolClassRequestDetail } from "./hooks/useSchoolClassRequestDetail";
import { Presenter } from "./Presenter";

type Props = {
  schoolClassRequestId: number;
};

export const SchoolClassRequestDetail = ({ schoolClassRequestId }: Props) => {
  const {
    request,
    error,
    retry,
    approve,
    reject,
    cancel,
    actionError,
    clearActionError,
  } = useSchoolClassRequestDetail(schoolClassRequestId);

  // 最初の読み込みとその失敗だけ AsyncBoundary で画面全体に出す。
  // 操作の後の取り直しの失敗は、ダイアログに出した 409 などのエラーを消さないよう Presenter の中で出す
  return (
    <AsyncBoundary data={request} error={!request && error} onRetry={retry}>
      {(loaded) => (
        <Presenter
          request={loaded}
          onApprove={approve}
          onReject={reject}
          onCancel={cancel}
          actionError={actionError}
          onClearActionError={clearActionError}
          refreshError={error}
          onRetry={retry}
        />
      )}
    </AsyncBoundary>
  );
};
