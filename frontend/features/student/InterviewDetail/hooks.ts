"use client";

import { useToast } from "@/components/ui/ToastProvider";
import { apiClient } from "@/libs/http/apiClient";
import { buildErrorMessage } from "@/libs/http/buildErrorMessage";
import { extractApiError } from "@/libs/http/extractApiError";
import type {
  InterviewRequest,
  InterviewRequestMessage,
} from "@/types/interview/interviewRequest";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// メッセージはスレッドとして1画面に全件並べるため、Rails の上限件数でまとめて取得する
const MESSAGES_PER_PAGE = "100";

export const useInterviewDetail = (interviewId: string) => {
  const [interview, setInterview] = useState<InterviewRequest | null>(null);
  const [messages, setMessages] = useState<InterviewRequestMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sendError, setSendError] = useState("");
  const [cancelError, setCancelError] = useState("");
  const router = useRouter();
  const { show } = useToast();

  const basePath = `/api/student/interview-requests/${interviewId}`;

  const fetchDetail = useCallback(async () => {
    try {
      const [interviewRes, messagesRes] = await Promise.all([
        apiClient.get<InterviewRequest>(basePath),
        apiClient.get<{
          interview_request_messages: InterviewRequestMessage[];
        }>(`${basePath}/messages`, { params: { per_page: MESSAGES_PER_PAGE } }),
      ]);
      setInterview(interviewRes.data);
      setMessages(messagesRes.data.interview_request_messages);
      setError(false);
    } catch (err) {
      if (extractApiError(err).status === 401) {
        router.push("/login");
        return;
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [basePath, router]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

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
      return false;
    }
  };

  const cancel = async (reason: string): Promise<boolean> => {
    if (!interview) return false;
    setCancelError("");

    try {
      await apiClient.delete(basePath, {
        data: { reason, lock_version: interview.lock_version },
      });
      show({ message: "面談をキャンセルしました", severity: "success" });
      await fetchDetail();
      return true;
    } catch (err) {
      const { status, errors } = extractApiError(err);
      if (status === 401) {
        router.push("/login");
        return false;
      }
      setCancelError(
        buildErrorMessage(errors, "面談のキャンセルに失敗しました"),
      );
      // 楽観ロックの競合(先生側で日程調整が進んだ等)は、最新の状態を取り直して再操作できるようにする
      if (status === 409) await fetchDetail();
      return false;
    }
  };

  const clearCancelError = () => setCancelError("");

  return {
    interview,
    messages,
    loading,
    error,
    sendMessage,
    sendError,
    cancel,
    cancelError,
    clearCancelError,
  };
};
