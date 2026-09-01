import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useTeacherNotificationResults } from "./hooks";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useTeacherNotificationResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("送信結果を取得しdataにセットする", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [
        {
          id: 1,
          email: "sato@example.com",
          status: "sent",
          formatted_sent_at: "2025/06/04 10:30",
          sender_user: { id: 1, name: "佐藤先生" },
          receiver_user: { id: 2, name: "田中太郎" },
        },
      ],
    });

    const { result } = renderHook(() => useTeacherNotificationResults());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].email).toBe("sato@example.com");
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/teacher/teacher_notification_results",
    );
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    const { result } = renderHook(() => useTeacherNotificationResults());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("401以外のエラー時はリダイレクトせずloadingが解除される", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useTeacherNotificationResults());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(pushMock).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });
});
