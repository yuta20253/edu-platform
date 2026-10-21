import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePeriodQuery } from "./usePeriodQuery";

const replaceMock = vi.fn();
const routerMock = { replace: replaceMock };
let searchParamsMock = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/analytics",
  useSearchParams: () => searchParamsMock,
}));

describe("usePeriodQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsMock = new URLSearchParams();
  });

  it("URLクエリの from・to を期間として返す", () => {
    searchParamsMock = new URLSearchParams("from=2026-09-19&to=2026-10-18");
    const { result } = renderHook(() => usePeriodQuery());

    expect(result.current.period).toEqual({
      from: "2026-09-19",
      to: "2026-10-18",
    });
  });

  it("URLクエリが不正なときはデフォルト期間(空)を返す", () => {
    searchParamsMock = new URLSearchParams("from=abc&to=2026-10-18");
    const { result } = renderHook(() => usePeriodQuery());

    expect(result.current.period).toEqual({ from: "", to: "" });
  });

  it("期間を変更するとURLクエリを置き換える", () => {
    const { result } = renderHook(() => usePeriodQuery());

    act(() => {
      result.current.setPeriod({ from: "2026-07-21", to: "2026-10-18" });
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "/analytics?from=2026-07-21&to=2026-10-18",
    );
  });

  it("URLクエリが変わらなければ同じ期間オブジェクトを返す(取得が二重に走らないように)", () => {
    searchParamsMock = new URLSearchParams("from=2026-09-19&to=2026-10-18");
    const { result, rerender } = renderHook(() => usePeriodQuery());
    const first = result.current.period;

    searchParamsMock = new URLSearchParams("from=2026-09-19&to=2026-10-18");
    rerender();

    expect(result.current.period).toBe(first);
  });
});
