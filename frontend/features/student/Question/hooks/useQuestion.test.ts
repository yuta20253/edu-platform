import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useQuestion } from "./useQuestion";
import type { QuestionType } from "@/types/question/question";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const makeQuestion = (overrides: Partial<QuestionType> = {}): QuestionType => ({
  id: 1,
  unit_id: 11,
  course_id: 1,
  question_text: "1 + 1 は？",
  answered: false,
  question_hints: [],
  question_choices: [
    { id: 101, question_id: 1, choice_number: 1, choice_text: "1" },
    { id: 102, question_id: 1, choice_number: 2, choice_text: "2" },
  ],
  ...overrides,
});

describe("useQuestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初期状態では先頭の問題がcurrentQuestionになる", () => {
    const questions = [makeQuestion({ id: 1 }), makeQuestion({ id: 2 })];
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11 }),
    );

    expect(result.current.currentQuestion?.id).toBe(1);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.isLastQuestion).toBe(false);
  });

  it("未回答の問題に回答するとapiClient.postが呼ばれ、結果がセットされる", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { is_correct: true } });
    const questions = [makeQuestion({ id: 1 }), makeQuestion({ id: 2 })];
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11 }),
    );

    await act(async () => {
      await result.current.handleAnswer(101);
    });

    expect(apiClient.post).toHaveBeenCalledWith("/api/student/answers", {
      task_id: 5,
      unit_id: 11,
      question_id: 1,
      question_choice_id: 101,
      time_spent_sec: expect.any(Number),
    });
    expect(apiClient.patch).not.toHaveBeenCalled();
    expect(result.current.selectedChoiceId).toBe(101);
    expect(result.current.isCorrect).toBe(true);
    expect(result.current.isAnswered).toBe(true);
  });

  it("解答中に端末時刻が巻き戻ってもtime_spent_secは0未満にならない", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { is_correct: true } });
    const questions = [makeQuestion({ id: 1 }), makeQuestion({ id: 2 })];

    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(100_000);
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11 }),
    );

    dateNowSpy.mockReturnValue(90_000);

    await act(async () => {
      await result.current.handleAnswer(101);
    });

    expect(apiClient.post).toHaveBeenCalledWith("/api/student/answers", {
      task_id: 5,
      unit_id: 11,
      question_id: 1,
      question_choice_id: 101,
      time_spent_sec: 0,
    });

    dateNowSpy.mockRestore();
  });

  it("既に回答済みの問題に回答し直すとapiClient.patchが呼ばれる", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { is_correct: false },
    });
    const questions = [makeQuestion({ id: 1, answered: true })];
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11 }),
    );

    await act(async () => {
      await result.current.handleAnswer(102);
    });

    expect(apiClient.patch).toHaveBeenCalledWith("/api/student/answers", {
      task_id: 5,
      unit_id: 11,
      question_id: 1,
      question_choice_id: 102,
      time_spent_sec: expect.any(Number),
    });
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("最終問題に回答すると結果画面へ遷移する", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { is_correct: true } });
    const questions = [makeQuestion({ id: 1 })];
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11 }),
    );

    expect(result.current.isLastQuestion).toBe(true);

    await act(async () => {
      await result.current.handleAnswer(101);
    });

    expect(pushMock).toHaveBeenCalledWith(
      "/tasks/5/units/11/questions/confirmation?answered_question_ids=1",
    );
  });

  it("goalIdがあるとき結果画面のパスはgoals配下になる", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { is_correct: true } });
    const questions = [makeQuestion({ id: 1 })];
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11, goalId: 3 }),
    );

    await act(async () => {
      await result.current.handleAnswer(101);
    });

    expect(pushMock).toHaveBeenCalledWith(
      "/goals/3/tasks/5/units/11/questions/confirmation?answered_question_ids=1",
    );
  });

  it("handleSkipで次の問題に進み、選択状態がリセットされる", () => {
    const questions = [makeQuestion({ id: 1 }), makeQuestion({ id: 2 })];
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11 }),
    );

    act(() => {
      result.current.handleSkip();
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentQuestion?.id).toBe(2);
    expect(result.current.selectedChoiceId).toBeNull();
    expect(result.current.isAnswered).toBe(false);
  });

  it("最終問題でhandleSkipを呼ぶと未回答のまま結果画面へ遷移する", () => {
    const questions = [makeQuestion({ id: 1 })];
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11 }),
    );

    act(() => {
      result.current.handleSkip();
    });

    expect(pushMock).toHaveBeenCalledWith(
      "/tasks/5/units/11/questions/confirmation?answered_question_ids=",
    );
  });

  it("最終問題でない場合は回答しても自動遷移せず、同じ問題に留まる", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { is_correct: true } });
    const questions = [makeQuestion({ id: 1 }), makeQuestion({ id: 2 })];
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11 }),
    );

    await act(async () => {
      await result.current.handleAnswer(101);
    });

    expect(pushMock).not.toHaveBeenCalled();
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.isAnswered).toBe(true);
  });

  it("studyLogIdがあるとき結果画面のURLにstudy_log_idが付与される", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { is_correct: true } });
    const questions = [makeQuestion({ id: 1 })];
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11, studyLogId: 42 }),
    );

    await act(async () => {
      await result.current.handleAnswer(101);
    });

    expect(pushMock).toHaveBeenCalledWith(
      "/tasks/5/units/11/questions/confirmation?answered_question_ids=1&study_log_id=42",
    );
  });

  it("回答が完了するとopenedHintStepが0にリセットされる", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { is_correct: true } });
    const questions = [makeQuestion({ id: 1 }), makeQuestion({ id: 2 })];
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11 }),
    );

    act(() => {
      result.current.setOpenedHintStep(2);
    });
    expect(result.current.openedHintStep).toBe(2);

    await act(async () => {
      await result.current.handleAnswer(101);
    });

    expect(result.current.openedHintStep).toBe(0);
  });

  it("次の問題に進むとopenedHintStepが0にリセットされる", () => {
    const questions = [makeQuestion({ id: 1 }), makeQuestion({ id: 2 })];
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11 }),
    );

    act(() => {
      result.current.setOpenedHintStep(1);
    });

    act(() => {
      result.current.handleSkip();
    });

    expect(result.current.openedHintStep).toBe(0);
  });

  it("送信中に再度回答しても二重に送信されない", async () => {
    let resolvePost: (value: {
      data: { is_correct: boolean };
    }) => void = () => {};
    vi.mocked(apiClient.post).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    );
    const questions = [makeQuestion({ id: 1 }), makeQuestion({ id: 2 })];
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11 }),
    );

    act(() => {
      result.current.handleAnswer(101);
    });
    expect(result.current.isSubmitting).toBe(true);

    act(() => {
      result.current.handleAnswer(101);
    });
    expect(apiClient.post).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePost({ data: { is_correct: true } });
      await Promise.resolve();
    });
  });

  it("回答の送信に失敗するとhasErrorがtrueになる", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("network error"));
    const questions = [makeQuestion({ id: 1 }), makeQuestion({ id: 2 })];
    const { result } = renderHook(() =>
      useQuestion({ questions, taskId: 5, unitId: 11 }),
    );

    await act(async () => {
      await result.current.handleAnswer(101);
    });

    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.isAnswered).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });
});
