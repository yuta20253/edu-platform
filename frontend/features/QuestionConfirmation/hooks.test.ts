import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGetQuestionConfirmation } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
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
