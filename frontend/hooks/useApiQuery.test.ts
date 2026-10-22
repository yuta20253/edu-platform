import { act, renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useApiQuery } from "./useApiQuery";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

type Item = { id: number };

// 保留中のPromise処理をすべて流してから状態を検証する
const flushPromises = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("useApiQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初期状態はdataがnullでerrorがfalse", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useApiQuery<Item>("/api/items"));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(false);
  });

  it("成功するとdataにレスポンスをセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 1 } });
    const { result } = renderHook(() =>
      useApiQuery<Item>("/api/items", { params: { page: 1 } }),
    );

    await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith("/api/items", {
      params: { page: 1 },
      signal: expect.any(AbortSignal),
    });
  });

  it("401以外で失敗するとerrorがtrueになりdataはnullのまま、遷移しない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });
    const { result } = renderHook(() => useApiQuery<Item>("/api/items"));

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.data).toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("401のときは/loginに遷移しエラー表示にはしない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });
    const { result } = renderHook(() => useApiQuery<Item>("/api/items"));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(result.current.error).toBe(false);
    expect(result.current.data).toBeNull();
  });

  describe("中断", () => {
    it("アンマウント時にリクエストを中断する", () => {
      vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
      const { unmount } = renderHook(() => useApiQuery<Item>("/api/items"));
      const signal = vi.mocked(apiClient.get).mock.calls[0][1]?.signal;

      expect(signal?.aborted).toBe(false);
      unmount();
      expect(signal?.aborted).toBe(true);
    });

    it("urlが変わると前のリクエストを中断し、古い応答で新しい表示を上書きしない", async () => {
      let resolveFirst: (value: { data: Item }) => void = () => {};
      vi.mocked(apiClient.get)
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
        )
        .mockResolvedValueOnce({ data: { id: 2 } });

      const { result, rerender } = renderHook(
        ({ url }) => useApiQuery<Item>(url),
        { initialProps: { url: "/api/items/1" } },
      );
      const firstSignal = vi.mocked(apiClient.get).mock.calls[0][1]?.signal;

      rerender({ url: "/api/items/2" });
      await waitFor(() => expect(result.current.data).toEqual({ id: 2 }));
      expect(firstSignal?.aborted).toBe(true);

      // 中断済みの古いリクエストが後から完了しても反映しない
      resolveFirst({ data: { id: 1 } });
      await flushPromises();
      expect(result.current.data).toEqual({ id: 2 });
    });

    it("中断されたリクエストの失敗はエラー表示にしない", async () => {
      let rejectFirst: (reason: unknown) => void = () => {};
      vi.mocked(apiClient.get)
        .mockReturnValueOnce(
          new Promise((_, reject) => {
            rejectFirst = reject;
          }),
        )
        .mockResolvedValueOnce({ data: { id: 2 } });

      const { result, rerender } = renderHook(
        ({ url }) => useApiQuery<Item>(url),
        { initialProps: { url: "/api/items/1" } },
      );
      rerender({ url: "/api/items/2" });
      await waitFor(() => expect(result.current.data).toEqual({ id: 2 }));

      rejectFirst(new axios.CanceledError());
      await flushPromises();
      expect(result.current.error).toBe(false);
    });
  });

  describe("再取得", () => {
    it("paramsの値が同じなら新しいオブジェクトを渡しても再取得しない", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 1 } });
      const { result, rerender } = renderHook(() =>
        useApiQuery<Item>("/api/items", { params: { page: 1 } }),
      );
      await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));

      rerender();
      await flushPromises();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it("paramsの値が変わると自動で再取得する", async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: { id: 1 } })
        .mockResolvedValueOnce({ data: { id: 2 } });
      const { result, rerender } = renderHook(
        ({ page }) => useApiQuery<Item>("/api/items", { params: { page } }),
        { initialProps: { page: 1 } },
      );
      await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));

      rerender({ page: 2 });

      await waitFor(() => expect(result.current.data).toEqual({ id: 2 }));
      expect(apiClient.get).toHaveBeenLastCalledWith("/api/items", {
        params: { page: 2 },
        signal: expect.any(AbortSignal),
      });
    });

    it("再取得中は前回のdataを残す", async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: { id: 1 } })
        .mockReturnValueOnce(new Promise(() => {}));
      const { result, rerender } = renderHook(
        ({ page }) => useApiQuery<Item>("/api/items", { params: { page } }),
        { initialProps: { page: 1 } },
      );
      await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));

      rerender({ page: 2 });
      await flushPromises();

      expect(result.current.data).toEqual({ id: 1 });
    });

    it("再取得の開始時にerrorを消す", async () => {
      vi.mocked(apiClient.get)
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockReturnValueOnce(new Promise(() => {}));
      const { result, rerender } = renderHook(
        ({ page }) => useApiQuery<Item>("/api/items", { params: { page } }),
        { initialProps: { page: 1 } },
      );
      await waitFor(() => expect(result.current.error).toBe(true));

      rerender({ page: 2 });

      await waitFor(() => expect(result.current.error).toBe(false));
    });

    it("refetchで手動再取得でき、取得中も前回のdataを残す", async () => {
      let resolveSecond: (value: { data: Item }) => void = () => {};
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: { id: 1 } })
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
        );
      const { result } = renderHook(() => useApiQuery<Item>("/api/items"));
      await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));

      act(() => result.current.refetch());
      await flushPromises();
      expect(apiClient.get).toHaveBeenCalledTimes(2);
      expect(result.current.data).toEqual({ id: 1 });

      resolveSecond({ data: { id: 2 } });
      await waitFor(() => expect(result.current.data).toEqual({ id: 2 }));
    });

    it("失敗後にrefetchするとerrorを解除して再取得する", async () => {
      vi.mocked(apiClient.get)
        .mockRejectedValueOnce({ response: { status: 500 } })
        .mockResolvedValueOnce({ data: { id: 1 } });
      const { result } = renderHook(() => useApiQuery<Item>("/api/items"));
      await waitFor(() => expect(result.current.error).toBe(true));

      act(() => result.current.refetch());

      await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));
      expect(result.current.error).toBe(false);
    });
  });

  describe("enabled", () => {
    it("falseの間は取得しない", async () => {
      const { result } = renderHook(() =>
        useApiQuery<Item>("/api/items", { enabled: false }),
      );
      await flushPromises();

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe(false);
    });

    it("trueに変わったら取得する", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 1 } });
      const { result, rerender } = renderHook(
        ({ enabled }) => useApiQuery<Item>("/api/items", { enabled }),
        { initialProps: { enabled: false } },
      );

      rerender({ enabled: true });

      await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));
    });

    it("取得中にfalseに変わったらリクエストを中断する", async () => {
      vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
      const { rerender } = renderHook(
        ({ enabled }) => useApiQuery<Item>("/api/items", { enabled }),
        { initialProps: { enabled: true } },
      );
      const signal = vi.mocked(apiClient.get).mock.calls[0][1]
        ?.signal as AbortSignal;

      rerender({ enabled: false });

      expect(signal.aborted).toBe(true);
    });

    it("取得後にfalseに変わってもkeepPreviousData省略時はdataを残す", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 1 } });
      const { result, rerender } = renderHook(
        ({ enabled }) => useApiQuery<Item>("/api/items", { enabled }),
        { initialProps: { enabled: true } },
      );
      await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));

      rerender({ enabled: false });
      await flushPromises();

      expect(result.current.data).toEqual({ id: 1 });
    });
  });

  describe("keepPreviousData", () => {
    it("falseなら再取得の開始時に前回のdataを消す", async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: { id: 1 } })
        .mockReturnValueOnce(new Promise(() => {}));
      const { result, rerender } = renderHook(
        ({ id }) =>
          useApiQuery<Item>("/api/items", {
            params: { id },
            keepPreviousData: false,
          }),
        { initialProps: { id: 1 } },
      );
      await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));

      rerender({ id: 2 });

      expect(result.current.data).toBeNull();
    });

    it("falseなら取得後にenabledがfalseに変わるとdataを消す", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 1 } });
      const { result, rerender } = renderHook(
        ({ enabled }) =>
          useApiQuery<Item>("/api/items", { enabled, keepPreviousData: false }),
        { initialProps: { enabled: true } },
      );
      await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));

      rerender({ enabled: false });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe(false);
    });

    it("falseなら失敗後にenabledがfalseに変わるとerrorを消す", async () => {
      vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 500 } });
      const { result, rerender } = renderHook(
        ({ enabled }) =>
          useApiQuery<Item>("/api/items", { enabled, keepPreviousData: false }),
        { initialProps: { enabled: true } },
      );
      await waitFor(() => expect(result.current.error).toBe(true));

      rerender({ enabled: false });

      expect(result.current.error).toBe(false);
    });
  });
});
