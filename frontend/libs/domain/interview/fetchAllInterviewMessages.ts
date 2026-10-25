// 面談のメッセージを全件取得する。生徒・教員の面談詳細で共通に使う。
import { apiClient } from "@/libs/http/apiClient";
import type { PaginationMeta } from "@/types/common/pagination";
import type { InterviewRequestMessage } from "@/types/interview/interviewRequest";

// メッセージはスレッドとして1画面に全件並べるため、バックエンドの上限件数ずつ取得する
const MESSAGES_PER_PAGE = "100";

type MessagesData = {
  interview_request_messages: InterviewRequestMessage[];
  meta?: PaginationMeta;
};

// バックエンドは古い順にページングするため、1ページ目だけだと最新のメッセージが欠ける。残りのページもまとめて取得する
// interviewPath は面談のAPIのパス(例: /api/student/interview-requests/1)
export const fetchAllInterviewMessages = async (interviewPath: string) => {
  const fetchPage = (page: number) =>
    apiClient.get<MessagesData>(`${interviewPath}/messages`, {
      params: { page: String(page), per_page: MESSAGES_PER_PAGE },
    });

  const first = await fetchPage(1);
  const totalPages = first.data.meta?.total_pages ?? 1;
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2)),
  );

  return [first, ...rest].flatMap((res) => res.data.interview_request_messages);
};
