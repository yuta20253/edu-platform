import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useCreateInterview, useGetTeachers } from "./hooks";

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
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const formValues = {
  teacher_id: 1,
  reason_category: "career" as const,
  reason_detail: "志望校について相談したい",
};

describe("useGetTeachers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("申請先の教員一覧を取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { teachers: [{ id: 1, name: "担任先生" }] },
    });
    const { result } = renderHook(() => useGetTeachers());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiClient.get).toHaveBeenCalledWith("/api/student/teachers");
    expect(result.current.teachers).toEqual([{ id: 1, name: "担任先生" }]);
    expect(result.current.error).toBe(false);
  });

  it("401 のときはログイン画面へ遷移する", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
    renderHook(() => useGetTeachers());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("その他のエラーのときは error を true にする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 500 } });
    const { result } = renderHook(() => useGetTeachers());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.loading).toBe(false);
  });
});

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
      "/api/student/interview-requests",
      formValues,
    );
    expect(showToastMock).toHaveBeenCalledWith({
      message: "面談を申請しました",
      severity: "success",
    });
    expect(pushMock).toHaveBeenCalledWith("/interviews");
  });

  it("422 のときは Rails のエラー内容を submitError にセットし遷移しない", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: {
        status: 422,
        data: { errors: ["この教員との進行中の面談が既に存在します"] },
      },
    });
    const { result } = renderHook(() => useCreateInterview());

    await act(() => result.current.onSubmit(formValues));

    expect(result.current.submitError).toBe(
      "この教員との進行中の面談が既に存在します",
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
