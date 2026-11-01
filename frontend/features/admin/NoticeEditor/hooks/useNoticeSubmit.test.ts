import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useNoticeSubmit } from "./useNoticeSubmit";
import type { NoticeFormValues } from "../types";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn(), patch: vi.fn() },
}));

const baseValues: NoticeFormValues = {
  title: "お知らせ",
  content: "本文",
  deliveryTiming: "draft",
  scheduledAt: null,
};

describe("useNoticeSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("新規作成", () => {
    it("下書き保存でstatus: draftを作成し一覧へ遷移する", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
      const { result } = renderHook(() => useNoticeSubmit({}));

      await act(async () => {
        await result.current.onSaveDraft(baseValues);
      });

      expect(apiClient.post).toHaveBeenCalledWith("/api/admin/notices", {
        title: "お知らせ",
        content: "本文",
        status: "draft",
        scheduled_at: null,
      });
      expect(pushMock).toHaveBeenCalledWith("/admin/notices");
    });

    it("即時配信でstatus: publishedを作成する", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
      const { result } = renderHook(() => useNoticeSubmit({}));

      await act(async () => {
        await result.current.onDeliver({
          ...baseValues,
          deliveryTiming: "immediate",
        });
      });

      expect(apiClient.post).toHaveBeenCalledWith("/api/admin/notices", {
        title: "お知らせ",
        content: "本文",
        status: "published",
        scheduled_at: null,
      });
      expect(pushMock).toHaveBeenCalledWith("/admin/notices");
    });

    it("予約配信でstatus: scheduledとscheduled_atを作成する", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
      const { result } = renderHook(() => useNoticeSubmit({}));
      const scheduledAt = new Date("2099-01-01T00:00:00.000Z");

      await act(async () => {
        await result.current.onDeliver({
          ...baseValues,
          deliveryTiming: "scheduled",
          scheduledAt,
        });
      });

      expect(apiClient.post).toHaveBeenCalledWith("/api/admin/notices", {
        title: "お知らせ",
        content: "本文",
        status: "scheduled",
        scheduled_at: scheduledAt.toISOString(),
      });
      expect(pushMock).toHaveBeenCalledWith("/admin/notices");
    });

    it("422エラー時はsubmitErrorにメッセージが設定され遷移しない", async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: {
          status: 422,
          data: { errors: ["タイトルを入力してください"] },
        },
      });
      const { result } = renderHook(() => useNoticeSubmit({}));

      await act(async () => {
        await result.current.onSaveDraft(baseValues);
      });

      expect(result.current.submitError).toBe("タイトルを入力してください");
      expect(pushMock).not.toHaveBeenCalled();
    });

    it("401エラー時はログイン画面へ遷移する", async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { status: 401 },
      });
      const { result } = renderHook(() => useNoticeSubmit({}));

      await act(async () => {
        await result.current.onSaveDraft(baseValues);
      });

      expect(pushMock).toHaveBeenCalledWith("/login");
    });
  });

  describe("編集", () => {
    it("下書きのお知らせを下書き保存するとstatus: draftをPATCHする(draft→draftの無変更)", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
      const { result } = renderHook(() => useNoticeSubmit({ noticeId: 1 }));

      await act(async () => {
        await result.current.onSaveDraft(baseValues);
      });

      expect(apiClient.patch).toHaveBeenCalledWith("/api/admin/notices/1", {
        title: "お知らせ",
        content: "本文",
        status: "draft",
        scheduled_at: null,
      });
      expect(pushMock).toHaveBeenCalledWith("/admin/notices");
    });

    it("予約配信中のお知らせで下書き保存するとバックエンドが遷移を拒否しsubmitErrorに反映される", async () => {
      vi.mocked(apiClient.patch).mockRejectedValue({
        response: {
          status: 422,
          data: {
            // バックエンド側にstatus属性の日本語訳がなく、human_attribute_nameが
            // "Status"にフォールバックするため、実際のfull_messagesはこの形になる
            errors: ["Status scheduled から draft へは変更できません"],
          },
        },
      });
      const { result } = renderHook(() => useNoticeSubmit({ noticeId: 1 }));

      act(() => {
        void result.current.onSaveDraft(baseValues);
      });

      await waitFor(() =>
        expect(result.current.submitError).toBe(
          "Status scheduled から draft へは変更できません",
        ),
      );
      expect(apiClient.patch).toHaveBeenCalledWith("/api/admin/notices/1", {
        title: "お知らせ",
        content: "本文",
        status: "draft",
        scheduled_at: null,
      });
      expect(pushMock).not.toHaveBeenCalledWith("/admin/notices");
    });

    it("即時配信は内容をPATCHしてからpublishエンドポイントを呼ぶ", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
      const { result } = renderHook(() => useNoticeSubmit({ noticeId: 1 }));

      await act(async () => {
        await result.current.onDeliver({
          ...baseValues,
          deliveryTiming: "immediate",
        });
      });

      expect(apiClient.patch).toHaveBeenCalledWith("/api/admin/notices/1", {
        title: "お知らせ",
        content: "本文",
      });
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/admin/notices/1/publish",
      );
      expect(pushMock).toHaveBeenCalledWith("/admin/notices");
    });

    it("予約配信はstatus: scheduledとscheduled_atをPATCHする", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
      const scheduledAt = new Date("2099-01-01T00:00:00.000Z");
      const { result } = renderHook(() => useNoticeSubmit({ noticeId: 1 }));

      await act(async () => {
        await result.current.onDeliver({
          ...baseValues,
          deliveryTiming: "scheduled",
          scheduledAt,
        });
      });

      expect(apiClient.patch).toHaveBeenCalledWith("/api/admin/notices/1", {
        title: "お知らせ",
        content: "本文",
        status: "scheduled",
        scheduled_at: scheduledAt.toISOString(),
      });
      expect(pushMock).toHaveBeenCalledWith("/admin/notices");
    });
  });
});
