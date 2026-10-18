import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useCumulativeAnalytics } from "./useCumulativeAnalytics";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const gradeAverage = {
  correct_rate: { my: 60, average: 55 },
  task_completion_rate: { my: 50, average: 45 },
};
const understandingScore = { subjects: [] };

const httpError = (status: number) =>
  Object.assign(new Error(`status ${status}`), { response: { status } });

const mockApi = (
  responses: Record<string, unknown> = {
    grade_average: gradeAverage,
    understanding_score: understandingScore,
  },
) => {
  vi.mocked(apiClient.get).mockImplementation(async (_url, config) => {
    const type = (config?.params as { type: string }).type;
    const response = responses[type];
    if (response instanceof Error) throw response;
    return { data: response };
  });
};

describe("useCumulativeAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi();
  });

  it("学年平均と理解度を取得する", async () => {
    const { result } = renderHook(() => useCumulativeAnalytics());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(apiClient.get).toHaveBeenCalledWith("/api/student/analytics", {
      params: { type: "grade_average" },
    });
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/analytics", {
      params: { type: "understanding_score" },
    });
    expect(result.current.gradeAverage).toEqual(gradeAverage);
    expect(result.current.understandingScore).toEqual(understandingScore);
  });

  it("片方の取得に失敗しても、もう片方は表示できるよう返す", async () => {
    mockApi({
      grade_average: httpError(500),
      understanding_score: understandingScore,
    });
    const { result } = renderHook(() => useCumulativeAnalytics());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.gradeAverage).toBeNull();
    expect(result.current.understandingScore).toEqual(understandingScore);
  });

  it("401 のときはログイン画面へ遷移する", async () => {
    mockApi({
      grade_average: httpError(401),
      understanding_score: httpError(401),
    });
    renderHook(() => useCumulativeAnalytics());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
