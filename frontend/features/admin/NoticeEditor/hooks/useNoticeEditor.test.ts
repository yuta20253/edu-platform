import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useNoticeEditor } from "./useNoticeEditor";
import type { NoticeFormValues } from "../types";

const pushMock = vi.fn();
const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const publisher = { id: 1, name: "管理者太郎", name_kana: "カンリシャタロウ" };

const draftNotice = {
  id: 1,
  title: "既存のお知らせ",
  content: "既存の本文",
  status: "draft" as const,
  target_type: "all_users" as const,
  published_at: null,
  scheduled_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  publisher,
};

const baseValues: NoticeFormValues = {
  title: "お知らせ",
  content: "本文",
  deliveryTiming: "draft",
  scheduledAt: null,
};

describe("useNoticeEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("新規作成", () => {
    it("下書き保存でstatus: draftを作成し一覧へ遷移する", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
      const { result } = renderHook(() => useNoticeEditor({}));

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
      const { result } = renderHook(() => useNoticeEditor({}));

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
      const { result } = renderHook(() => useNoticeEditor({}));
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
      const { result } = renderHook(() => useNoticeEditor({}));

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
      const { result } = renderHook(() => useNoticeEditor({}));

      await act(async () => {
        await result.current.onSaveDraft(baseValues);
      });

      expect(pushMock).toHaveBeenCalledWith("/login");
    });
  });

  describe("編集", () => {
    it("マウント時にお知らせ詳細を取得する", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { announcement: draftNotice },
      });

      const { result } = renderHook(() => useNoticeEditor({ noticeId: 1 }));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(apiClient.get).toHaveBeenCalledWith("/api/admin/notices/1");
      expect(result.current.notice).toEqual(draftNotice);
    });

    it("配信済みのお知らせは一覧へリダイレクトする", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { announcement: { ...draftNotice, status: "published" } },
      });

      renderHook(() => useNoticeEditor({ noticeId: 1 }));

      await waitFor(() =>
        expect(replaceMock).toHaveBeenCalledWith("/admin/notices"),
      );
    });

    it("下書き保存はタイトル・本文のみPATCHし、statusは送らない", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { announcement: draftNotice },
      });
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useNoticeEditor({ noticeId: 1 }));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.onSaveDraft(baseValues);
      });

      expect(apiClient.patch).toHaveBeenCalledWith("/api/admin/notices/1", {
        title: "お知らせ",
        content: "本文",
      });
      expect(pushMock).toHaveBeenCalledWith("/admin/notices");
    });

    it("即時配信は内容をPATCHしてからpublishエンドポイントを呼ぶ", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { announcement: draftNotice },
      });
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      const { result } = renderHook(() => useNoticeEditor({ noticeId: 1 }));
      await waitFor(() => expect(result.current.loading).toBe(false));

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
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { announcement: draftNotice },
      });
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
      const scheduledAt = new Date("2099-01-01T00:00:00.000Z");

      const { result } = renderHook(() => useNoticeEditor({ noticeId: 1 }));
      await waitFor(() => expect(result.current.loading).toBe(false));

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
