import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchAddresses } from "./useFetchAddresses";

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useFetchAddresses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetchCitiesで取得した市区町村を重複なくcityOptionsにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        { id: 1, city: "千代田区", town: "千代田" },
        { id: 2, city: "千代田区", town: "丸の内" },
        { id: 3, city: "港区", town: "六本木" },
      ],
    });

    const { result } = renderHook(() => useFetchAddresses());

    act(() => {
      result.current.fetchCities(13);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.cityOptions).toEqual(["千代田区", "港区"]);
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/addresses", {
      params: { prefecture_id: 13 },
    });
  });

  it("fetchTownsで取得した町名をtownOptionsにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 1, city: "千代田区", town: "千代田" }],
    });

    const { result } = renderHook(() => useFetchAddresses());

    act(() => {
      result.current.fetchTowns(13, "千代田区");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.townOptions).toEqual([
      { id: 1, city: "千代田区", town: "千代田" },
    ]);
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/addresses", {
      params: { prefecture_id: 13, city: "千代田区" },
    });
  });

  it("resetTownOptionsで保留中のfetchTownsをキャンセルしtownOptionsを即時更新する", async () => {
    const { result } = renderHook(() => useFetchAddresses());

    act(() => {
      result.current.fetchTowns(13, "千代田区");
    });

    act(() => {
      result.current.resetTownOptions([
        { id: 1, city: "千代田区", town: "千代田" },
      ]);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(result.current.townOptions).toEqual([
      { id: 1, city: "千代田区", town: "千代田" },
    ]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
