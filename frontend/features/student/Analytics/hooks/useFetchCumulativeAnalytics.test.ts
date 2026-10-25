import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchCumulativeAnalytics } from "./useFetchCumulativeAnalytics";

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

const mockApi = (responses: Record<string, unknown>) => {
  vi.mocked(apiClient.get).mockImplementation(async (_url, config) => {
    const type = (config?.params as { type: string }).type;
    const response = responses[type];
    if (response instanceof Error) throw response;
    return { data: response };
  });
};

describe("useFetchCumulativeAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi({
      grade_average: gradeAverage,
      understanding_score: understandingScore,
    });
  });

  it("学年平均と理解度を取得する", async () => {
    const { result } = renderHook(() => useFetchCumulativeAnalytics());

    await waitFor(() => {
      expect(result.current.gradeAverage.data).toEqual(gradeAverage);
      expect(result.current.understandingScore.data).toEqual(
        understandingScore,
      );
    });
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/analytics", {
      params: { type: "grade_average" },
      signal: expect.any(AbortSignal),
    });
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/analytics", {
      params: { type: "understanding_score" },
      signal: expect.any(AbortSignal),
    });
  });

  it("片方の取得に失敗しても、もう片方は返す", async () => {
    mockApi({
      grade_average: httpError(500),
      understanding_score: understandingScore,
    });
    const { result } = renderHook(() => useFetchCumulativeAnalytics());

    await waitFor(() => {
      expect(result.current.gradeAverage.error).toBe(true);
      expect(result.current.understandingScore.data).toEqual(
        understandingScore,
      );
    });
    expect(result.current.gradeAverage.data).toBeNull();
    expect(result.current.understandingScore.error).toBe(false);
  });

  it("失敗した方だけを取得し直せる", async () => {
    mockApi({
      grade_average: httpError(500),
      understanding_score: understandingScore,
    });
    const { result } = renderHook(() => useFetchCumulativeAnalytics());
    await waitFor(() => expect(result.current.gradeAverage.error).toBe(true));
    mockApi({
      grade_average: gradeAverage,
      understanding_score: understandingScore,
    });
    vi.mocked(apiClient.get).mockClear();

    act(() => {
      result.current.gradeAverage.refetch();
    });

    await waitFor(() =>
      expect(result.current.gradeAverage.data).toEqual(gradeAverage),
    );
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/analytics", {
      params: { type: "grade_average" },
      signal: expect.any(AbortSignal),
    });
  });

  it("401 のときはログイン画面へ遷移する", async () => {
    mockApi({
      grade_average: httpError(401),
      understanding_score: httpError(401),
    });
    renderHook(() => useFetchCumulativeAnalytics());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });
});
