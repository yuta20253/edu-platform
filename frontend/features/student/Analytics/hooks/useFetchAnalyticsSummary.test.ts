import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import type { AnalyticsSummary } from "../types";
import { useFetchAnalyticsSummary } from "./useFetchAnalyticsSummary";

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

describe("useFetchAnalyticsSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({ data: summary });
  });

  it("期間を指定して summary を取得する", async () => {
    const { result } = renderHook(() => useFetchAnalyticsSummary(period));

    // data も error もない間がローディング
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(false);
    await waitFor(() => expect(result.current.data).toEqual(summary));

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/student/analytics/summary",
      { params: period, signal: expect.any(AbortSignal) },
    );
  });

  it("期間が空のときはクエリを付けずに取得する(バックエンドの既定値で集計する)", async () => {
    const { result } = renderHook(() =>
      useFetchAnalyticsSummary({ from: "", to: "" }),
    );
    await waitFor(() => expect(result.current.data).toEqual(summary));

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
      ({ current }) => useFetchAnalyticsSummary(current),
      { initialProps: { current: period } },
    );
    const firstSignal = vi.mocked(apiClient.get).mock.calls[0][1]
      ?.signal as AbortSignal;

    rerender({ current: { from: "2026-09-19", to: "2026-10-18" } });
    await waitFor(() => expect(result.current.data).toEqual(newSummary));

    expect(firstSignal.aborted).toBe(true);
    resolveOld({ data: oldSummary });
    await Promise.resolve();
    expect(result.current.data).toEqual(newSummary);
  });

  it("401 のときはログイン画面へ遷移する", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(httpError(401));
    renderHook(() => useFetchAnalyticsSummary(period));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("422 のときは error にせず、検証メッセージを返す", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(
      httpError(422, { errors: ["取得期間は366日以内で指定してください"] }),
    );
    const { result } = renderHook(() => useFetchAnalyticsSummary(period));
    await waitFor(() =>
      expect(result.current.validationErrors).not.toEqual([]),
    );

    expect(result.current.error).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.validationErrors).toEqual([
      "取得期間は366日以内で指定してください",
    ]);
  });

  it("422 でメッセージが無いときは代わりの文言を返す", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(httpError(422));
    const { result } = renderHook(() => useFetchAnalyticsSummary(period));

    await waitFor(() =>
      expect(result.current.validationErrors).toEqual([
        "指定した期間では集計できません",
      ]),
    );
  });

  it("422 のあとで取得に成功したら検証メッセージを消す", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce(httpError(422, { errors: ["エラー"] }))
      .mockResolvedValueOnce({ data: summary });
    const { result, rerender } = renderHook(
      ({ current }) => useFetchAnalyticsSummary(current),
      { initialProps: { current: period } },
    );
    await waitFor(() =>
      expect(result.current.validationErrors).toEqual(["エラー"]),
    );

    rerender({ current: { from: "", to: "" } });
    await waitFor(() => expect(result.current.data).toEqual(summary));
    expect(result.current.validationErrors).toEqual([]);
  });

  it("それ以外のエラーのときは error を返す", async () => {
    vi.mocked(apiClient.get).mockRejectedValue(httpError(500));
    const { result } = renderHook(() => useFetchAnalyticsSummary(period));
    await waitFor(() => expect(result.current.error).toBe(true));

    expect(result.current.data).toBeNull();
    expect(result.current.validationErrors).toEqual([]);
  });

  it("期間を切り替えている間は前の期間の data を残し、refreshing を返す", async () => {
    const { result, rerender } = renderHook(
      ({ current }) => useFetchAnalyticsSummary(current),
      { initialProps: { current: period } },
    );
    await waitFor(() => expect(result.current.data).toEqual(summary));
    expect(result.current.refreshing).toBe(false);
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));

    rerender({ current: { from: "2026-09-19", to: "2026-10-18" } });

    expect(result.current.data).toEqual(summary);
    expect(result.current.refreshing).toBe(true);
  });

  it("refetch で取得し直せる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce(httpError(500))
      .mockResolvedValueOnce({ data: summary });
    const { result } = renderHook(() => useFetchAnalyticsSummary(period));
    await waitFor(() => expect(result.current.error).toBe(true));

    act(() => {
      result.current.refetch();
    });

    expect(result.current.error).toBe(false);
    await waitFor(() => expect(result.current.data).toEqual(summary));
  });
});
