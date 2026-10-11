import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useGetInterviews } from "./useGetInterviews";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

const emptyResponse = {
  data: {
    interview_requests: [],
    meta: { current_page: 1, total_pages: 0, total_count: 0, per_page: 20 },
  },
};

describe("useGetInterviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue(emptyResponse);
  });

  it("面談一覧を1ページ目・全ステータスで取得しdataにセットする", async () => {
    const { result } = renderHook(() => useGetInterviews());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(emptyResponse.data);
    expect(result.current.error).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/student/interview-requests",
      { params: { page: "1" }, signal: expect.any(AbortSignal) },
    );
  });

  it("ステータスを切り替えると status 付き・1ページ目で再取得する", async () => {
    const { result } = renderHook(() => useGetInterviews());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setStatus("confirmed"));

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenLastCalledWith(
        "/api/student/interview-requests",
        {
          params: { page: "1", status: "confirmed" },
          signal: expect.any(AbortSignal),
        },
      ),
    );
    expect(result.current.page).toBe(1);
  });

  it("401 のときはログイン画面へ遷移する", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    renderHook(() => useGetInterviews());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("その他のエラーのときは error を true にする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 500 } });
    const { result } = renderHook(() => useGetInterviews());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
