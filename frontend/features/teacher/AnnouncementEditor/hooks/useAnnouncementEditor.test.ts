import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useAnnouncementEditor } from "./useAnnouncementEditor";
import type { AnnouncementFormValues } from "../types";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn(), patch: vi.fn() },
}));

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
});
