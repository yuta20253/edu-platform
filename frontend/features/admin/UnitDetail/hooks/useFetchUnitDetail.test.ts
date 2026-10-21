import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useFetchUnitDetail } from "./useFetchUnitDetail";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useFetchUnitDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockReset();
  });

  it("unitIdが変わると、新しい単元が届くまで前の単元の内容を表示しない", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: { id: 1 } })
      .mockReturnValueOnce(new Promise(() => {}));

    const { result, rerender } = renderHook(
      ({ unitId }) => useFetchUnitDetail(1, unitId),
      { initialProps: { unitId: 1 } },
    );
    await waitFor(() => expect(result.current.unit).toEqual({ id: 1 }));

    act(() => {
      rerender({ unitId: 2 });
    });

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
    expect(result.current.unit).toBeNull();
  });
});
