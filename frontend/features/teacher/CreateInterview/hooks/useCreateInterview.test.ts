import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useCreateInterview } from "./useCreateInterview";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

const showToastMock = vi.fn();
vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({ show: showToastMock }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

const formValues = {
  student_id: 1,
  reason_detail: "最近の成績について話したい",
};

describe("useCreateInterview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("入力内容を送信し、成功したらトーストを出して一覧へ遷移する", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { message: "面談を申請しました" },
    });
    const { result } = renderHook(() => useCreateInterview());

    await act(() => result.current.onSubmit(formValues));

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/teacher/interview-requests",
      formValues,
    );
    expect(showToastMock).toHaveBeenCalledWith({
      message: "面談を申請しました",
      severity: "success",
    });
    expect(pushMock).toHaveBeenCalledWith("/teacher/interviews");
  });

  it("422 のときは バックエンドのエラー内容を submitError にセットし遷移しない", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: {
        status: 422,
        data: { errors: ["この生徒との進行中の面談が既に存在します"] },
      },
    });
    const { result } = renderHook(() => useCreateInterview());

    await act(() => result.current.onSubmit(formValues));

    expect(result.current.submitError).toBe(
      "この生徒との進行中の面談が既に存在します",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("エラー内容が無いときは既定のメッセージを submitError にセットする", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({ response: { status: 500 } });
    const { result } = renderHook(() => useCreateInterview());

    await act(() => result.current.onSubmit(formValues));

    expect(result.current.submitError).toBe("面談の申請に失敗しました");
  });

  it("401 のときはログイン画面へ遷移する", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({ response: { status: 401 } });
    const { result } = renderHook(() => useCreateInterview());

    await act(() => result.current.onSubmit(formValues));

    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
