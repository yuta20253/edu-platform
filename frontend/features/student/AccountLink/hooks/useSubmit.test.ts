import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useSubmit } from "./useSubmit";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

describe("useSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("送信成功時、紐付けAPIを呼び出しホームへ遷移する", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { message: "アカウントの紐付けが成功しました" },
    });
    const { result } = renderHook(() => useSubmit());

    await act(async () => {
      await result.current.onSubmit(
        { student_number: "AB12-CD3456" },
        undefined as never,
      );
    });

    expect(apiClient.post).toHaveBeenCalledWith("/api/student/account-link", {
      student_number: "AB12-CD3456",
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/"));
  });
});
