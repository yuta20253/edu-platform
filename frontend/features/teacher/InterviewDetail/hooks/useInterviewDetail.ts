"use client";

import { useToast } from "@/components/ui/ToastProvider";
import { teacherInterviewActions } from "@/libs/domain/interview/teacherInterviewActions";
import { fetchAllInterviewMessages } from "@/libs/domain/interview/fetchAllInterviewMessages";
import { apiClient } from "@/libs/http/apiClient";
import { buildErrorMessage } from "@/libs/http/buildErrorMessage";
import { extractApiError } from "@/libs/http/extractApiError";
import type {
  InterviewRequest,
  InterviewRequestMessage,
} from "@/types/interview/interviewRequest";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// 409: 楽観ロックの競合(他の操作や生徒側の操作が先に反映された)
// 422: 生徒が先にキャンセルした等で、既にその操作ができない状態になっている
// いずれも画面の面談情報が古いため、最新の状態を取り直す
const isStaleInterviewError = (status?: number) =>
  status === 409 || status === 422;

export const useInterviewDetail = (interviewId: number) => {
  const [interview, setInterview] = useState<InterviewRequest | null>(null);
  const [messages, setMessages] = useState<InterviewRequestMessage[]>([]);
  const [error, setError] = useState(false);
  // 日程確定・完了・却下/キャンセルのダイアログに出すエラー(同時に開くダイアログは1つ)
  const [actionError, setActionError] = useState("");
  const [sendError, setSendError] = useState("");
  const router = useRouter();
  const { show } = useToast();

  const basePath = `/api/teacher/interview-requests/${interviewId}`;

  // 取り直し中も前回の面談情報は残す(画面全体がスピナーに戻らないようにする)
  const fetchDetail = useCallback(async () => {
    setError(false);
    try {
      const [interviewRes, allMessages] = await Promise.all([
        apiClient.get<InterviewRequest>(basePath),
        fetchAllInterviewMessages(basePath),
      ]);
      setInterview(interviewRes.data);
      setMessages(allMessages);
    } catch (err) {
      if (extractApiError(err).status === 401) {
        router.push("/login");
        return;
      }
      setError(true);
    }
  }, [basePath, router]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // 日程確定・完了・却下/キャンセルの共通処理。成功時に true を返す
  const runAction = async (
    request: () => Promise<unknown>,
    successMessage: string,
    fallbackError: string,
  ): Promise<boolean> => {
    setActionError("");
    try {
      await request();
      show({ message: successMessage, severity: "success" });
      await fetchDetail();
      return true;
    } catch (err) {
      const { status, errors } = extractApiError(err);
      if (status === 401) {
        router.push("/login");
        return false;
      }
      setActionError(buildErrorMessage(errors, fallbackError));
      if (isStaleInterviewError(status)) await fetchDetail();
      return false;
    }
  };

  const schedule = (scheduledAt: Date) =>
    runAction(
      () =>
        apiClient.patch(basePath, {
          status: "confirmed",
          scheduled_at: scheduledAt.toISOString(),
          lock_version: interview?.lock_version,
        }),
      "面談の日程を確定しました",
      "面談の更新に失敗しました",
    );

  const complete = () =>
    runAction(
      () =>
        apiClient.patch(basePath, {
          status: "completed",
          lock_version: interview?.lock_version,
        }),
      "面談を完了にしました",
      "面談の更新に失敗しました",
    );

  const cancel = (reason: string) => {
    const isReject =
      !!interview && teacherInterviewActions(interview).cancelKind === "reject";

    return runAction(
      () =>
        apiClient.delete(basePath, {
          data: { reason, lock_version: interview?.lock_version },
        }),
      isReject ? "面談の申請を却下しました" : "面談をキャンセルしました",
      isReject
        ? "面談の申請の却下に失敗しました"
        : "面談のキャンセルに失敗しました",
    );
  };

  // メッセージ送信で面談が「申請中→日程調整中」に進み lock_version も変わるため、送信後は面談ごと取り直す
  const sendMessage = async (body: string): Promise<boolean> => {
    setSendError("");
    try {
      await apiClient.post(`${basePath}/messages`, { body });
      await fetchDetail();
      return true;
    } catch (err) {
      const { status, errors } = extractApiError(err);
      if (status === 401) {
        router.push("/login");
        return false;
      }
      setSendError(buildErrorMessage(errors, "メッセージの送信に失敗しました"));
      if (isStaleInterviewError(status)) await fetchDetail();
      return false;
    }
  };

  return {
    interview,
    messages,
    error,
    retry: fetchDetail,
    schedule,
    complete,
    cancel,
    actionError,
    clearActionError: () => setActionError(""),
    sendMessage,
    sendError,
  };
};
