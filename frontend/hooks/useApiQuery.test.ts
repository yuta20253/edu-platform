import { renderHook, waitFor } from "@testing-library/react";
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
});
