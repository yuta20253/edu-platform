import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useCreateSchoolClassRequest } from "./useCreateSchoolClassRequest";

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

describe("useCreateSchoolClassRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { message: "学級作成申請を受け付けました" },
    });
  });

  it("新設は学年とクラス名だけを送信し、成功したらトーストを出して一覧へ遷移する", async () => {
    const { result } = renderHook(() => useCreateSchoolClassRequest());

    await act(() =>
      result.current.onSubmit({
        action: "creation",
        grade_id: 1,
        school_class_id: 3,
        name: "1年F組",
      }),
    );

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/teacher/school-class-requests",
      { action: "creation", grade_id: 1, name: "1年F組" },
    );
    expect(showToastMock).toHaveBeenCalledWith({
      message: "学級の新設を申請しました",
      severity: "success",
    });
    expect(pushMock).toHaveBeenCalledWith("/teacher/school-class-requests");
  });

  it("改名は学年・対象クラス・新しいクラス名を送信する", async () => {
    const { result } = renderHook(() => useCreateSchoolClassRequest());

    await act(() =>
      result.current.onSubmit({
        action: "modification",
        grade_id: 1,
        school_class_id: 3,
        name: "1年E組",
      }),
    );

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/teacher/school-class-requests",
      { action: "modification", grade_id: 1, school_class_id: 3, name: "1年E組" },
    );
    expect(showToastMock).toHaveBeenCalledWith({
      message: "学級の改名を申請しました",
      severity: "success",
    });
  });

  it("削除は学年と対象クラスだけを送信する", async () => {
    const { result } = renderHook(() => useCreateSchoolClassRequest());

    await act(() =>
      result.current.onSubmit({
        action: "deletion",
        grade_id: 1,
        school_class_id: 3,
        name: "入力途中の名前",
      }),
    );

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/teacher/school-class-requests",
      { action: "deletion", grade_id: 1, school_class_id: 3 },
    );
    expect(showToastMock).toHaveBeenCalledWith({
      message: "学級の削除を申請しました",
      severity: "success",
    });
  });

  it("422 のときは バックエンドのエラー内容を submitError にセットし遷移しない", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: {
        status: 422,
        data: {
          errors: [
            "School classは生徒または教員が所属しているため削除できません",
          ],
        },
      },
    });
    const { result } = renderHook(() => useCreateSchoolClassRequest());

    await act(() =>
      result.current.onSubmit({
        action: "deletion",
        grade_id: 1,
        school_class_id: 3,
      }),
    );

    expect(result.current.submitError).toBe(
      "School classは生徒または教員が所属しているため削除できません",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("エラー内容が無いときは既定のメッセージを submitError にセットする", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({ response: { status: 500 } });
    const { result } = renderHook(() => useCreateSchoolClassRequest());

    await act(() =>
      result.current.onSubmit({
        action: "creation",
        grade_id: 1,
        name: "1年F組",
      }),
    );

    expect(result.current.submitError).toBe("学級の申請に失敗しました");
  });

  it("401 のときはログイン画面へ遷移する", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({ response: { status: 401 } });
    const { result } = renderHook(() => useCreateSchoolClassRequest());

    await act(() =>
      result.current.onSubmit({
        action: "creation",
        grade_id: 1,
        name: "1年F組",
      }),
    );

    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
