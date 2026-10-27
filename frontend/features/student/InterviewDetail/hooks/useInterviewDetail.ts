"use client";

import { useToast } from "@/components/ui/ToastProvider";
import { fetchAllInterviewMessages } from "@/libs/domain/interview/fetchAllInterviewMessages";
import { apiClient } from "@/libs/http/apiClient";
import { buildErrorMessage } from "@/libs/http/buildErrorMessage";
import { extractApiError } from "@/libs/http/extractApiError";
import type {
  InterviewRequest,
  InterviewRequestMessage,
} from "@/types/interview/interviewRequest";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// 409: 楽観ロックの競合(先生側で日程調整が進んだ等)
// 422: 先生が先にキャンセルした・面談が終了した等で、既に操作できない状態になっている
// いずれも画面の面談情報が古いため、最新の状態を取り直す
const isStaleInterviewError = (status?: number) =>
  status === 409 || status === 422;

export const useInterviewDetail = (interviewId: string) => {
  const [interview, setInterview] = useState<InterviewRequest | null>(null);
  const [messages, setMessages] = useState<InterviewRequestMessage[]>([]);
  const [error, setError] = useState(false);
  const [sendError, setSendError] = useState("");
  const [cancelError, setCancelError] = useState("");
  const refetching = useRef(false);
  const router = useRouter();
  const { show } = useToast();

  const basePath = `/api/student/interview-requests/${interviewId}`;

  const fetchDetail = useCallback(async () => {
    try {
      const [interviewRes, allMessages] = await Promise.all([
        apiClient.get<InterviewRequest>(basePath),
        fetchAllInterviewMessages(basePath),
      ]);
      setInterview(interviewRes.data);
      setMessages(allMessages);
      setError(false);
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

  // 再試行は表示を初期状態(スピナー)に戻してから取り直す。
  // 失敗状態のまま取り直すと、押しても成功するまで画面が変わらず、
  // 取り直しの失敗のあとは更新前の面談やメッセージが最新のように見えてしまう。
  // 連打で取得が並列に走らないよう、再試行中は何もしない(送信・キャンセル後の
  // 取り直しは fetchDetail を直接呼ぶので、この抑止の対象にしない)。
  const refetch = async () => {
    if (refetching.current) return;
    refetching.current = true;
    setError(false);
    setInterview(null);
    setMessages([]);
    try {
      await fetchDetail();
    } finally {
      refetching.current = false;
    }
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
      if (isStaleInterviewError(status)) await fetchDetail();
      return false;
    }
  };

  const clearCancelError = () => setCancelError("");

  return {
    interview,
    messages,
    error,
    refetch,
    sendMessage,
    sendError,
    cancel,
    cancelError,
    clearCancelError,
  };
};
