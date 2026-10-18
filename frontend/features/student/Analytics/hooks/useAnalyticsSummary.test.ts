import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import type { AnalyticsSummary } from "../types";
import { useAnalyticsSummary } from "./useAnalyticsSummary";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const summary = { streak_days: 3 } as AnalyticsSummary;
const period = { from: "2026-10-12", to: "2026-10-18" };

const httpError = (status: number, data: unknown = {}) =>
  Object.assign(new Error(`status ${status}`), { response: { status, data } });

describe("useAnalyticsSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({ data: summary });
  });

  it("期間を指定して summary を取得する", async () => {
    const { result } = renderHook(() => useAnalyticsSummary(period));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/student/analytics/summary",
      { params: period, signal: expect.any(AbortSignal) },
    );
    expect(result.current.summary).toEqual(summary);
  });

  it("期間が空のときはクエリを付けずに取得する(バックエンドの既定値で集計する)", async () => {
    const { result } = renderHook(() =>
      useAnalyticsSummary({ from: "", to: "" }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/student/analytics/summary",
      { params: {}, signal: expect.any(AbortSignal) },
    );
  });

  it("期間が変わったら前のリクエストを中断し、古い応答で上書きしない", async () => {
    const oldSummary = { streak_days: 1 } as AnalyticsSummary;
    const newSummary = { streak_days: 2 } as AnalyticsSummary;
    let resolveOld: (value: { data: AnalyticsSummary }) => void = () => {};
    vi.mocked(apiClient.get)
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveOld = resolve)),
      )
      .mockResolvedValueOnce({ data: newSummary });

    const { result, rerender } = renderHook(
      ({ current }) => useAnalyticsSummary(current),
      { initialProps: { current: period } },
    );
    const firstSignal = vi.mocked(apiClient.get).mock.calls[0][1]
      ?.signal as AbortSignal;

    rerender({ current: { from: "2026-09-19", to: "2026-10-18" } });
    await waitFor(() => expect(result.current.summary).toEqual(newSummary));

    expect(firstSignal.aborted).toBe(true);
    resolveOld({ data: oldSummary });
    await Promise.resolve();
    expect(result.current.summary).toEqual(newSummary);
  });

  it("401 のときはログイン画面へ遷移する", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(httpError(401));
    renderHook(() => useAnalyticsSummary(period));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("422 のときは error にせず、検証メッセージを返す", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(
      httpError(422, { errors: ["取得期間は366日以内で指定してください"] }),
    );
    const { result } = renderHook(() => useAnalyticsSummary(period));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(false);
    expect(result.current.summary).toBeNull();
    expect(result.current.validationErrors).toEqual([
      "取得期間は366日以内で指定してください",
    ]);
  });

  it("422 でメッセージが無いときは代わりの文言を返す", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(httpError(422));
    const { result } = renderHook(() => useAnalyticsSummary(period));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.validationErrors).toEqual([
      "指定した期間では集計できません",
    ]);
  });

  it("422 のあとで取得に成功したら検証メッセージを消す", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce(httpError(422, { errors: ["エラー"] }))
      .mockResolvedValueOnce({ data: summary });
    const { result, rerender } = renderHook(
      ({ current }) => useAnalyticsSummary(current),
      { initialProps: { current: period } },
    );
    await waitFor(() =>
      expect(result.current.validationErrors).toEqual(["エラー"]),
    );

    rerender({ current: { from: "", to: "" } });
    await waitFor(() => expect(result.current.summary).toEqual(summary));
    expect(result.current.validationErrors).toEqual([]);
  });

  it("それ以外のエラーのときは error を返す", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(httpError(500));
    const { result } = renderHook(() => useAnalyticsSummary(period));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(true);
    expect(result.current.summary).toBeNull();
    expect(result.current.validationErrors).toEqual([]);
  });
});
