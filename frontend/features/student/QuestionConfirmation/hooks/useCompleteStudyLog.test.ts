import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useCompleteStudyLog } from "./useCompleteStudyLog";

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

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

  it("study_log完了後に続けてsubmissionエンドポイントを呼ぶ", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({});

    renderHook(() =>
      useCompleteStudyLog({ taskId: 5, unitId: 11, studyLogId: 99 }),
    );

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/api/student/tasks/5/submission",
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

    await waitFor(() => expect(apiClient.patch).toHaveBeenCalledTimes(2));

    rerender({ studyLogId: 99 });

    expect(apiClient.patch).toHaveBeenCalledTimes(2);
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
