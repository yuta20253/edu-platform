import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useAnnouncementEditor } from "./useAnnouncementEditor";
import type { AnnouncementEditData, AnnouncementFormValues } from "../types";

const pushMock = vi.fn();
const replaceMock = vi.fn();
// 実際のrouterと同じく、描画ごとに同じオブジェクトを返す(取得のeffectが再実行され続けないように)
const router = { push: pushMock, replace: replaceMock };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const editData: AnnouncementEditData = {
  announcement: {
    id: 9,
    title: "既存のお知らせ",
    content: "既存の本文",
    status: "draft",
    scheduled_at: null,
  },
  announcement_targets: [
    {
      id: 10,
      target_type: "by_user",
      high_school_id: null,
      grade_id: null,
      user_role_id: null,
      user_id: 5,
      user_name: "山田太郎",
    },
  ],
};

const baseValues: AnnouncementFormValues = {
  title: "お知らせ",
  content: "本文",
  targets: [{ target_type: "all_users" }],
  deliveryTiming: "draft",
  scheduledAt: null,
};

describe("useAnnouncementEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("下書き保存はstatus: draftでPOSTし一覧へ遷移する", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { announcement_id: 1 },
    });
    const { result } = renderHook(() => useAnnouncementEditor());

    await act(async () => {
      await result.current.onSaveDraft(baseValues);
    });

    expect(apiClient.post).toHaveBeenCalledWith("/api/teacher/announcements", {
      title: "お知らせ",
      content: "本文",
      announcement_targets: baseValues.targets,
      status: "draft",
    });
    expect(pushMock).toHaveBeenCalledWith("/teacher/announcements");
  });

  it("即時配信はstatus: publishedを付けて1回のPOSTで作成する", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { announcement_id: 5 },
    });
    const { result } = renderHook(() => useAnnouncementEditor());

    await act(async () => {
      await result.current.onDeliver({
        ...baseValues,
        deliveryTiming: "immediate",
      });
    });

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith("/api/teacher/announcements", {
      title: "お知らせ",
      content: "本文",
      announcement_targets: baseValues.targets,
      status: "published",
    });
    expect(apiClient.patch).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/teacher/announcements");
  });

  it("予約配信はstatus: scheduledとscheduled_atを付けて1回のPOSTで作成する", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { announcement_id: 7 },
    });
    const { result } = renderHook(() => useAnnouncementEditor());
    const scheduledAt = new Date("2099-01-01T00:00:00.000Z");

    await act(async () => {
      await result.current.onDeliver({
        ...baseValues,
        deliveryTiming: "scheduled",
        scheduledAt,
      });
    });

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith("/api/teacher/announcements", {
      title: "お知らせ",
      content: "本文",
      announcement_targets: baseValues.targets,
      status: "scheduled",
      scheduled_at: scheduledAt.toISOString(),
    });
    expect(apiClient.patch).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/teacher/announcements");
  });

  it("作成時に422エラーが返るとsubmitErrorに反映され遷移しない", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: {
        status: 422,
        data: { errors: ["タイトルを入力してください"] },
      },
    });
    const { result } = renderHook(() => useAnnouncementEditor());

    await act(async () => {
      await result.current.onSaveDraft(baseValues);
    });

    expect(result.current.submitError).toBe("タイトルを入力してください");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("配信時に422エラーが返るとsubmitErrorに反映され遷移しない", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: {
        status: 422,
        data: { errors: ["配信日時 は未来日時を指定してください"] },
      },
    });
    const { result } = renderHook(() => useAnnouncementEditor());

    await act(async () => {
      await result.current.onDeliver({
        ...baseValues,
        deliveryTiming: "scheduled",
        scheduledAt: new Date("2099-01-01T00:00:00.000Z"),
      });
    });

    expect(result.current.submitError).toBe(
      "配信日時 は未来日時を指定してください",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("401エラー時はログイン画面へ遷移する", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { status: 401 },
    });
    const { result } = renderHook(() => useAnnouncementEditor());

    await act(async () => {
      await result.current.onSaveDraft(baseValues);
    });

    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("新規作成時は編集データを取得しない", () => {
    const { result } = renderHook(() => useAnnouncementEditor());

    expect(result.current.isEditMode).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  describe("編集時の取得", () => {
    it("編集データを取得してeditDataに入れる", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: editData });
      const { result } = renderHook(() => useAnnouncementEditor(9));

      expect(result.current.isEditMode).toBe(true);
      await waitFor(() => expect(result.current.editData).toEqual(editData));
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/teacher/announcements/9/edit",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      expect(result.current.fetchError).toBeNull();
    });

    it("404(配信済み・存在しない)のときは一覧へリダイレクトする", async () => {
      vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 404 } });
      const { result } = renderHook(() => useAnnouncementEditor(9));

      await waitFor(() =>
        expect(replaceMock).toHaveBeenCalledWith("/teacher/announcements"),
      );
      expect(result.current.fetchError).toBeNull();
    });

    it("403(他の教員のお知らせ)のときはfetchErrorがforbiddenになる", async () => {
      vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 403 } });
      const { result } = renderHook(() => useAnnouncementEditor(9));

      await waitFor(() => expect(result.current.fetchError).toBe("forbidden"));
      expect(result.current.editData).toBeNull();
    });

    it("401のときはログイン画面へ遷移しエラーにしない", async () => {
      vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 401 } });
      const { result } = renderHook(() => useAnnouncementEditor(9));

      await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
      expect(result.current.fetchError).toBeNull();
    });

    it("その他の失敗はfetchErrorがfailedになり、refetchで再取得できる", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce({
        response: { status: 500 },
      });
      const { result } = renderHook(() => useAnnouncementEditor(9));

      await waitFor(() => expect(result.current.fetchError).toBe("failed"));

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: editData });
      act(() => result.current.refetch());

      await waitFor(() => expect(result.current.editData).toEqual(editData));
      expect(result.current.fetchError).toBeNull();
    });
  });

  describe("編集時の保存", () => {
    const editValues: AnnouncementFormValues = {
      ...baseValues,
      targets: [{ target_type: "by_user", user_id: 5 }],
    };

    const renderEditHook = async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: editData });
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: { message: "お知らせを更新しました。" },
      });
      const hook = renderHook(() => useAnnouncementEditor(9));
      await waitFor(() => expect(hook.result.current.editData).not.toBeNull());
      return hook;
    };

    it("下書き保存は全項目をstatus: draftで1回PATCHし一覧へ遷移する", async () => {
      const { result } = await renderEditHook();

      await act(async () => {
        await result.current.onSaveDraft(editValues);
      });

      expect(apiClient.patch).toHaveBeenCalledTimes(1);
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/api/teacher/announcements/9",
        {
          title: "お知らせ",
          content: "本文",
          announcement_targets: [{ target_type: "by_user", user_id: 5 }],
          status: "draft",
          scheduled_at: null,
        },
      );
      expect(apiClient.post).not.toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/teacher/announcements");
    });

    it("即時配信は全項目をstatus: publishedで1回PATCHする", async () => {
      const { result } = await renderEditHook();

      await act(async () => {
        await result.current.onDeliver({
          ...editValues,
          deliveryTiming: "immediate",
        });
      });

      expect(apiClient.patch).toHaveBeenCalledTimes(1);
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/api/teacher/announcements/9",
        expect.objectContaining({ status: "published", scheduled_at: null }),
      );
      expect(apiClient.post).not.toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/teacher/announcements");
    });

    it("予約配信は全項目をstatus: scheduledとscheduled_atで1回PATCHする", async () => {
      const { result } = await renderEditHook();
      const scheduledAt = new Date("2099-01-01T00:00:00.000Z");

      await act(async () => {
        await result.current.onDeliver({
          ...editValues,
          deliveryTiming: "scheduled",
          scheduledAt,
        });
      });

      expect(apiClient.patch).toHaveBeenCalledTimes(1);
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/api/teacher/announcements/9",
        {
          title: "お知らせ",
          content: "本文",
          announcement_targets: [{ target_type: "by_user", user_id: 5 }],
          status: "scheduled",
          scheduled_at: scheduledAt.toISOString(),
        },
      );
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it("422エラーが返るとsubmitErrorに反映され遷移しない", async () => {
      const { result } = await renderEditHook();
      vi.mocked(apiClient.patch).mockRejectedValue({
        response: {
          status: 422,
          data: { errors: ["配信済みのお知らせは編集できません"] },
        },
      });

      await act(async () => {
        await result.current.onSaveDraft(editValues);
      });

      expect(result.current.submitError).toBe(
        "配信済みのお知らせは編集できません",
      );
      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});
