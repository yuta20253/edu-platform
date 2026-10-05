import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useSubmit } from "./useSubmit";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

const showToastMock = vi.fn();
vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({ show: showToastMock }),
}));

describe("useSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("送信成功時、紐付けAPIを呼び出し成功メッセージを表示してからホームへ遷移する", async () => {
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
    expect(showToastMock).toHaveBeenCalledWith({
      message: "アカウントの紐付けが完了しました",
      severity: "success",
    });
    expect(pushMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(pushMock).toHaveBeenCalledWith("/profile");
  });

  it("生徒番号が見つからない場合(404)、専用のエラーメッセージをセットする", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { status: 404, data: { message: "Userが見つかりません" } },
    });
    const { result } = renderHook(() => useSubmit());

    await act(async () => {
      await result.current.onSubmit(
        { student_number: "NOT-EXIST" },
        undefined as never,
      );
    });

    expect(result.current.errorMessage).toBe(
      "入力された生徒コードが見つかりません",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("重複などRails側のバリデーションエラー(400)のメッセージをセットする", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: {
        status: 400,
        data: { errors: ["既に紐付けられています"] },
      },
    });
    const { result } = renderHook(() => useSubmit());

    await act(async () => {
      await result.current.onSubmit(
        { student_number: "AB12-CD3456" },
        undefined as never,
      );
    });

    expect(result.current.errorMessage).toBe("既に紐付けられています");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("未ログインの場合(401)、ログイン画面へ遷移する", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { status: 401, data: { message: "UNAUTHORIZED" } },
    });
    const { result } = renderHook(() => useSubmit());

    await act(async () => {
      await result.current.onSubmit(
        { student_number: "AB12-CD3456" },
        undefined as never,
      );
    });

    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
