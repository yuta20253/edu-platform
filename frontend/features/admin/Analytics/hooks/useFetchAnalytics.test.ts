import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import type { AnalyticsData } from "../types";
import { useFetchAnalytics } from "./useFetchAnalytics";

const pushMock = vi.fn();
const replaceMock = vi.fn();
// 実際の useRouter は安定した参照を返すため、モックも同一オブジェクトにする
const routerMock = { push: pushMock, replace: replaceMock };
let searchParamsMock = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/admin/analytics",
  useSearchParams: () => searchParamsMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const analyticsData = { kpis: {}, meta: {} } as unknown as AnalyticsData;

const mockApi = (
  overrides: Partial<Record<string, unknown | (() => unknown)>> = {},
) => {
  vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
    const override = overrides[url];
    if (
      override instanceof Error ||
      (override && "response" in (override as object))
    ) {
      throw override;
    }
    if (override !== undefined) return { data: override };
    if (url === "/api/admin/analytics") return { data: analyticsData };
    if (url === "/api/admin/schools") {
      return {
        data: {
          schools: [{ id: 1, name: "A高校" }],
          meta: { current_page: 1, total_pages: 1 },
        },
      };
    }
    if (url === "/api/admin/courses") {
      return {
        data: {
          courses: [
            { id: 1, subject: { id: 2, name: "数学" } },
            { id: 2, subject: { id: 2, name: "数学" } },
            { id: 3, subject: { id: 1, name: "英語" } },
          ],
          meta: { current_page: 1, total_pages: 1 },
        },
      };
    }
    throw new Error(`unexpected url: ${url}`);
  });
};

const analyticsCalls = () =>
  vi
    .mocked(apiClient.get)
    .mock.calls.filter(([url]) => url === "/api/admin/analytics");

describe("useFetchAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock = new URLSearchParams();
    mockApi();
  });

  it("初回表示で分析データを取得し、取得完了までは data が null", async () => {
    const { result } = renderHook(() => useFetchAnalytics());

    expect(result.current.data).toBeNull();
    await waitFor(() => expect(result.current.data).toEqual(analyticsData));
    expect(result.current.error).toBe(false);
  });

  it("URLクエリのフィルタをAPIパラメータとして送る", async () => {
    searchParamsMock = new URLSearchParams(
      "from=2026-09-01&to=2026-09-30&high_school_id=1&subject_id=2",
    );
    renderHook(() => useFetchAnalytics());

    await waitFor(() => expect(analyticsCalls()).toHaveLength(1));
    expect(analyticsCalls()[0][1]).toEqual({
      params: {
        from: "2026-09-01",
        to: "2026-09-30",
        high_school_id: "1",
        subject_id: "2",
      },
      signal: expect.any(AbortSignal),
    });
  });

  it("URLクエリから現在のフィルタ値を返す", async () => {
    searchParamsMock = new URLSearchParams("from=2026-09-01&to=2026-09-30");
    const { result } = renderHook(() => useFetchAnalytics());

    expect(result.current.filters).toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
      highSchoolId: "",
      subjectId: "",
    });
    await waitFor(() => expect(result.current.data).not.toBeNull());
  });

  it("フィルタを変更するとURLクエリを更新する", async () => {
    const { result } = renderHook(() => useFetchAnalytics());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => {
      result.current.onFiltersChange({ from: "2026-09-01", to: "2026-09-30" });
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "/admin/analytics?from=2026-09-01&to=2026-09-30",
    );
  });

  it("フィルタ変更時は既存のフィルタ値を引き継ぐ", async () => {
    searchParamsMock = new URLSearchParams("subject_id=2");
    const { result } = renderHook(() => useFetchAnalytics());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => {
      result.current.onFiltersChange({ highSchoolId: "1" });
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "/admin/analytics?high_school_id=1&subject_id=2",
    );
  });

  it("フィルタがすべて空になったらクエリなしのパスに更新する", async () => {
    searchParamsMock = new URLSearchParams("subject_id=2");
    const { result } = renderHook(() => useFetchAnalytics());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    act(() => {
      result.current.onFiltersChange({ subjectId: "" });
    });

    expect(replaceMock).toHaveBeenCalledWith("/admin/analytics");
  });

  it("401 のときは /login へ遷移する", async () => {
    mockApi({ "/api/admin/analytics": { response: { status: 401 } } });
    renderHook(() => useFetchAnalytics());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("401 以外のエラーでは error が true になり、再試行で再取得する", async () => {
    mockApi({ "/api/admin/analytics": { response: { status: 500 } } });
    const { result } = renderHook(() => useFetchAnalytics());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(pushMock).not.toHaveBeenCalled();

    mockApi();
    act(() => {
      result.current.onRetry();
    });

    await waitFor(() => expect(result.current.data).toEqual(analyticsData));
    expect(result.current.error).toBe(false);
    expect(analyticsCalls()).toHaveLength(2);
  });

  it("422 のときは error にせず、検証メッセージを返す", async () => {
    mockApi({
      "/api/admin/analytics": {
        response: {
          status: 422,
          data: { errors: ["指定できる期間は366日以内です"] },
        },
      },
    });
    const { result } = renderHook(() => useFetchAnalytics());

    await waitFor(() =>
      expect(result.current.validationErrors).toEqual([
        "指定できる期間は366日以内です",
      ]),
    );
    expect(result.current.error).toBe(false);
  });

  it("422 の後に正常取得できたら検証メッセージを消す", async () => {
    mockApi({
      "/api/admin/analytics": {
        response: { status: 422, data: { errors: ["期間が不正です"] } },
      },
    });
    const { result, rerender } = renderHook(() => useFetchAnalytics());
    await waitFor(() =>
      expect(result.current.validationErrors).toHaveLength(1),
    );

    mockApi();
    searchParamsMock = new URLSearchParams("from=2026-09-01&to=2026-09-30");
    rerender();

    await waitFor(() => expect(result.current.data).toEqual(analyticsData));
    expect(result.current.validationErrors).toEqual([]);
  });

  it("再取得中は前回のデータを保持したまま isRefetching が true になる", async () => {
    const { result, rerender } = renderHook(() => useFetchAnalytics());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    let resolveNext: (value: unknown) => void = () => {};
    vi.mocked(apiClient.get).mockImplementationOnce(
      () => new Promise((resolve) => (resolveNext = resolve)),
    );
    searchParamsMock = new URLSearchParams("subject_id=2");
    rerender();

    await waitFor(() => expect(result.current.isRefetching).toBe(true));
    expect(result.current.data).toEqual(analyticsData);

    await act(async () => {
      resolveNext({ data: analyticsData });
    });
    await waitFor(() => expect(result.current.isRefetching).toBe(false));
  });

  it("高校の選択肢を取得する", async () => {
    const { result } = renderHook(() => useFetchAnalytics());

    await waitFor(() =>
      expect(result.current.highSchoolOptions).toEqual([
        { id: 1, name: "A高校" },
      ]),
    );
  });

  it("高校が複数ページにまたがる場合は全ページ取得する", async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url, config) => {
      if (url === "/api/admin/analytics") return { data: analyticsData };
      if (url === "/api/admin/courses") {
        return { data: { courses: [], meta: { total_pages: 1 } } };
      }
      const page = Number((config?.params as { page: number }).page);
      return {
        data: {
          schools: [{ id: page, name: `${page}校目` }],
          meta: { current_page: page, total_pages: 2 },
        },
      };
    });
    const { result } = renderHook(() => useFetchAnalytics());

    await waitFor(() =>
      expect(result.current.highSchoolOptions).toEqual([
        { id: 1, name: "1校目" },
        { id: 2, name: "2校目" },
      ]),
    );
  });

  it("科目の選択肢を講座から重複排除して取得する", async () => {
    const { result } = renderHook(() => useFetchAnalytics());

    await waitFor(() =>
      expect(result.current.subjectOptions).toEqual([
        { id: 1, name: "英語" },
        { id: 2, name: "数学" },
      ]),
    );
  });

  it("選択肢の取得が失敗しても分析データは表示できる", async () => {
    mockApi({
      "/api/admin/schools": { response: { status: 500 } },
      "/api/admin/courses": { response: { status: 500 } },
    });
    const { result } = renderHook(() => useFetchAnalytics());

    await waitFor(() => expect(result.current.data).toEqual(analyticsData));
    expect(result.current.highSchoolOptions).toEqual([]);
    expect(result.current.subjectOptions).toEqual([]);
  });
});
