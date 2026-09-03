import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGetQuestions } from "./useGetQuestions";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useGetQuestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("問題一覧を取得しquestionsにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        {
          id: 1,
          unit_id: 11,
          course_id: 1,
          question_text: "1 + 1 は？",
          answered: false,
          question_hints: [],
          question_choices: [],
        },
      ],
    });

    const { result } = renderHook(() =>
      useGetQuestions({ taskId: 5, unitId: 11 }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(false);
    expect(result.current.questions).toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/student/tasks/5/units/11/questions",
    );
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useGetQuestions({ taskId: 5, unitId: 11 }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("401以外のエラー時はerrorがtrueになりquestionsは空配列になる", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() =>
      useGetQuestions({ taskId: 5, unitId: 11 }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.questions).toEqual([]);
  });
});
