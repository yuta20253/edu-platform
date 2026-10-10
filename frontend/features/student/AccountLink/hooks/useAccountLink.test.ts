import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useAccountLink } from "./useAccountLink";

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

describe("useAccountLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("onPreviewSubmit(入力→確認画面)", () => {
    it("プレビューAPIを呼び出し、成功時にconfirmステップへ進む", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          high_school_name: "北海道札幌西高等学校",
          grade_display_name: "高1生",
          school_class_name: "A組",
        },
      });
      const { result } = renderHook(() => useAccountLink());

      await act(async () => {
        await result.current.onPreviewSubmit(
          { student_number: "AB12-CD3456" },
          undefined as never,
        );
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/student/account-link/preview",
        { student_number: "AB12-CD3456" },
      );
      expect(result.current.step).toBe("confirm");
      expect(result.current.preview).toEqual({
        high_school_name: "北海道札幌西高等学校",
        grade_display_name: "高1生",
        school_class_name: "A組",
      });
    });

    it("全角文字が入力された場合、半角に変換してから送信する", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          high_school_name: "北海道札幌西高等学校",
          grade_display_name: "高1生",
          school_class_name: "A組",
        },
      });
      const { result } = renderHook(() => useAccountLink());

      await act(async () => {
        await result.current.onPreviewSubmit(
          { student_number: "ＡＢ１２－ＣＤ３４５６" },
          undefined as never,
        );
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/student/account-link/preview",
        { student_number: "AB12-CD3456" },
      );
    });

    it("見つからない/既に使用済みの場合、previewErrorをセットしconfirmへ進まない", async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: {
          status: 404,
          data: {
            errors: [
              "見つからないか、すでに使用されています。心当たりがある場合は学校へお問い合わせください",
            ],
          },
        },
      });
      const { result } = renderHook(() => useAccountLink());

      await act(async () => {
        await result.current.onPreviewSubmit(
          { student_number: "NOT-EXIST" },
          undefined as never,
        );
      });

      expect(result.current.step).toBe("input");
      expect(result.current.previewError).toBe(
        "見つからないか、すでに使用されています。心当たりがある場合は学校へお問い合わせください",
      );
    });

    it("未ログインの場合(401)、ログイン画面へ遷移する", async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { status: 401, data: { message: "UNAUTHORIZED" } },
      });
      const { result } = renderHook(() => useAccountLink());

      await act(async () => {
        await result.current.onPreviewSubmit(
          { student_number: "AB12-CD3456" },
          undefined as never,
        );
      });

      expect(pushMock).toHaveBeenCalledWith("/login");
      expect(result.current.step).toBe("input");
    });
  });

  describe("onBack(確認画面から入力へ戻る)", () => {
    it("stepがinputに戻りpreviewがクリアされる", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          high_school_name: "北海道札幌西高等学校",
          grade_display_name: "高1生",
          school_class_name: "A組",
        },
      });
      const { result } = renderHook(() => useAccountLink());

      await act(async () => {
        await result.current.onPreviewSubmit(
          { student_number: "AB12-CD3456" },
          undefined as never,
        );
      });

      act(() => {
        result.current.onBack();
      });

      expect(result.current.step).toBe("input");
      expect(result.current.preview).toBeNull();
    });
  });

  describe("onConfirm(確認画面で確定)", () => {
    const previewAndConfirmSetup = async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          high_school_name: "北海道札幌西高等学校",
          grade_display_name: "高1生",
          school_class_name: "A組",
        },
      });
      const { result } = renderHook(() => useAccountLink());

      await act(async () => {
        await result.current.onPreviewSubmit(
          { student_number: "AB12-CD3456" },
          undefined as never,
        );
      });

      return result;
    };

    it("確定APIを呼び出し、成功メッセージを表示してからホームへ遷移する", async () => {
      const result = await previewAndConfirmSetup();
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} });

      await act(async () => {
        await result.current.onConfirm();
      });

      expect(apiClient.post).toHaveBeenLastCalledWith(
        "/api/student/account-link",
        { student_number: "AB12-CD3456" },
      );
      expect(showToastMock).toHaveBeenCalledWith({
        message: "アカウントの紐付けが完了しました",
        severity: "success",
      });
      expect(result.current.isLinked).toBe(true);
      expect(pushMock).not.toHaveBeenCalledWith("/profile");

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(pushMock).toHaveBeenCalledWith("/profile");
    });

    it("確定時にエラー(400)が発生した場合、confirmErrorをセットする", async () => {
      const result = await previewAndConfirmSetup();
      vi.mocked(apiClient.post).mockRejectedValueOnce({
        response: { status: 400, data: { errors: ["既に紐付けられています"] } },
      });

      await act(async () => {
        await result.current.onConfirm();
      });

      expect(result.current.confirmError).toBe("既に紐付けられています");
      expect(result.current.isLinked).toBe(false);
    });

    it("確定時に未ログイン(401)の場合、ログイン画面へ遷移する", async () => {
      const result = await previewAndConfirmSetup();
      vi.mocked(apiClient.post).mockRejectedValueOnce({
        response: { status: 401, data: { message: "UNAUTHORIZED" } },
      });

      await act(async () => {
        await result.current.onConfirm();
      });

      expect(pushMock).toHaveBeenCalledWith("/login");
    });
  });
});
