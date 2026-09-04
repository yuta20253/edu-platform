import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGetQuestionConfirmation, useCompleteStudyLog } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

describe("useGetQuestionConfirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("問題履歴を取得しquestionHistoriesにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        {
          question_id: 1,
          question_text: "1 + 1 は？",
          correct_answer: "2",
          is_correct: true,
          selected_choice_number: 2,
          status: "answered",
        },
      ],
    });

    const { result } = renderHook(() =>
      useGetQuestionConfirmation({
        taskId: 5,
        unitId: 11,
        answeredQuestionIds: [1, 2],
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(false);
    expect(result.current.questionHistories).toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/student/tasks/5/units/11/confirmation",
      { params: { answered_question_ids: "1,2" } },
    );
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useGetQuestionConfirmation({ taskId: 5, unitId: 11 }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("401以外のエラー時はerrorがtrueになりquestionHistoriesは空配列になる", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() =>
      useGetQuestionConfirmation({ taskId: 5, unitId: 11 }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.questionHistories).toEqual([]);
  });
});

describe("useCompleteStudyLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("studyLogIdがあるとき、study_logを完了させるリクエストを送る", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({});

    renderHook(() =>
      useCompleteStudyLog({ taskId: 5, unitId: 11, studyLogId: 99 }),
    );

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/api/student/tasks/5/units/11/study_logs/99",
      ),
    );
  });

  it("studyLogIdがないときは何も送信しない", () => {
    renderHook(() => useCompleteStudyLog({ taskId: 5, unitId: 11 }));

    expect(apiClient.patch).not.toHaveBeenCalled();
  });

  it("再レンダーされても完了リクエストは1回だけ送信される", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({});

    const { rerender } = renderHook(
      (props: { studyLogId?: number }) =>
        useCompleteStudyLog({ taskId: 5, unitId: 11, ...props }),
      { initialProps: { studyLogId: 99 } },
    );

    await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(1));

    rerender({ studyLogId: 99 });

    expect(apiClient.patch).toHaveBeenCalledTimes(1);
  });

  it("完了リクエストが失敗してもエラーを投げない", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue(new Error("network error"));

    expect(() =>
      renderHook(() =>
        useCompleteStudyLog({ taskId: 5, unitId: 11, studyLogId: 99 }),
      ),
    ).not.toThrow();

    await waitFor(() => expect(apiClient.patch).toHaveBeenCalled());
  });
});
