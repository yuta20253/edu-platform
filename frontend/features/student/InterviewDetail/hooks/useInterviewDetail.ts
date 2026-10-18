"use client";

import { useToast } from "@/components/ui/ToastProvider";
import { apiClient } from "@/libs/http/apiClient";
import { buildErrorMessage } from "@/libs/http/buildErrorMessage";
import { extractApiError } from "@/libs/http/extractApiError";
import type { PaginationMeta } from "@/types/common/pagination";
import type {
  InterviewRequest,
  InterviewRequestMessage,
} from "@/types/interview/interviewRequest";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// 409: 楽観ロックの競合(先生側で日程調整が進んだ等)
// 422: 先生が先にキャンセルした・面談が終了した等で、既に操作できない状態になっている
// いずれも画面の面談情報が古いため、最新の状態を取り直す
const isStaleInterviewError = (status?: number) =>
  status === 409 || status === 422;

// メッセージはスレッドとして1画面に全件並べるため、Rails の上限件数ずつ取得する
const MESSAGES_PER_PAGE = "100";

type MessagesData = {
  interview_request_messages: InterviewRequestMessage[];
  meta?: PaginationMeta;
};

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

  // Rails は古い順にページングするため、1ページ目だけだと最新のメッセージが欠ける。残りのページもまとめて取得する
  const fetchAllMessages = useCallback(async () => {
    const fetchPage = (page: number) =>
      apiClient.get<MessagesData>(`${basePath}/messages`, {
        params: { page: String(page), per_page: MESSAGES_PER_PAGE },
      });

    const first = await fetchPage(1);
    const totalPages = first.data.meta?.total_pages ?? 1;
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2)),
    );

    return [first, ...rest].flatMap(
      (res) => res.data.interview_request_messages,
    );
  }, [basePath]);

  const fetchDetail = useCallback(async () => {
    try {
      const [interviewRes, allMessages] = await Promise.all([
        apiClient.get<InterviewRequest>(basePath),
        fetchAllMessages(),
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
    } finally {
      setLoading(false);
    }
  }, [basePath, fetchAllMessages, router]);

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
    loading,
    error,
    sendMessage,
    sendError,
    cancel,
    cancelError,
    clearCancelError,
  };
};
