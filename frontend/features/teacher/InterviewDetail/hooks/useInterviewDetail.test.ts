import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useInterviewDetail } from "./useInterviewDetail";

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
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const basePath = "/api/teacher/interview-requests/1";

const interview = {
  id: 1,
  status: "requested",
  initiator_role: "student",
  lock_version: 3,
  student_id: 10,
  teacher_id: 20,
};
const message = (id: number) => ({
  id,
  body: `メッセージ${id}`,
  sender_id: 10,
  sender_name: "生徒太郎",
  created_at: "2026-10-01T10:00:00+09:00",
});

const conflictError = {
  response: {
    status: 409,
    data: {
      errors: [
        "他のユーザーによってデータが更新されています。再読み込みしてください",
      ],
    },
  },
};

const mockGet = (overrides: { interview?: object } = {}) => {
  vi.mocked(apiClient.get).mockImplementation((url: string) => {
    if (url.endsWith("/messages")) {
      return Promise.resolve({
        data: {
          interview_request_messages: [message(100)],
          meta: { total_pages: 1 },
        },
      });
    }
    return Promise.resolve({ data: overrides.interview ?? interview });
  });
};

const renderLoaded = async () => {
  const hook = renderHook(() => useInterviewDetail(1));
  await waitFor(() => expect(hook.result.current.interview).not.toBeNull());
  return hook;
};

// 初回の取得(面談・メッセージ)を除いた、操作後の取り直しの回数
const refetchCount = () =>
  vi.mocked(apiClient.get).mock.calls.filter(([url]) => url === basePath)
    .length - 1;

describe("useInterviewDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet();
  });

  describe("取得", () => {
    it("面談とメッセージを取得する", async () => {
      const { result } = await renderLoaded();

      expect(apiClient.get).toHaveBeenCalledWith(basePath);
      expect(result.current.interview).toEqual(interview);
      expect(result.current.messages).toEqual([message(100)]);
      expect(result.current.error).toBe(false);
    });

    it("メッセージが複数ページにわたるときは、すべてのページを古い順につなげる", async () => {
      vi.mocked(apiClient.get).mockImplementation(
        (url: string, config?: { params?: { page?: string } }) => {
          if (url.endsWith("/messages")) {
            const page = Number(config?.params?.page);
            return Promise.resolve({
              data: {
                interview_request_messages: [message(page)],
                meta: { total_pages: 3 },
              },
            });
          }
          return Promise.resolve({ data: interview });
        },
      );

      const { result } = await renderLoaded();

      expect(apiClient.get).toHaveBeenCalledWith(`${basePath}/messages`, {
        params: { page: "1", per_page: "100" },
      });
      expect(result.current.messages.map((m) => m.id)).toEqual([1, 2, 3]);
    });

    it("取得に失敗すると error が true になり、retry で取り直せる", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce({
        response: { status: 500 },
      });
      const { result } = renderHook(() => useInterviewDetail(1));

      await waitFor(() => expect(result.current.error).toBe(true));
      expect(result.current.interview).toBeNull();

      mockGet();
      await act(async () => {
        await result.current.retry();
      });

      await waitFor(() => expect(result.current.interview).toEqual(interview));
      expect(result.current.error).toBe(false);
    });

    it("取得が重なって古い結果が後から届いても、最後に出した取得の結果を残す", async () => {
      const { result } = await renderLoaded();

      // 1回目の取り直しは遅く(lock_version: 5)、2回目は先に返る(lock_version: 6)
      let resolveSlow: (value: { data: object }) => void = () => {};
      const slow = new Promise<{ data: object }>((resolve) => {
        resolveSlow = resolve;
      });
      const responses = [
        slow,
        Promise.resolve({ data: { ...interview, lock_version: 6 } }),
      ];
      vi.mocked(apiClient.get).mockImplementation((url: string) => {
        if (url.endsWith("/messages")) {
          return Promise.resolve({
            data: { interview_request_messages: [], meta: { total_pages: 1 } },
          });
        }
        return responses.shift() as Promise<{ data: object }>;
      });

      let first: Promise<void> = Promise.resolve();
      await act(async () => {
        first = result.current.retry();
        await result.current.retry();
      });
      expect(result.current.interview?.lock_version).toBe(6);

      await act(async () => {
        resolveSlow({ data: { ...interview, lock_version: 5 } });
        await first;
      });

      expect(result.current.interview?.lock_version).toBe(6);
    });

    it("401 のときはログイン画面に遷移し、エラーにしない", async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { status: 401 },
      });
      const { result } = renderHook(() => useInterviewDetail(1));

      await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
      expect(result.current.error).toBe(false);
    });
  });

  describe("日程の確定", () => {
    const scheduledAt = new Date("2026-11-01T16:00:00+09:00");

    it("確定ステータス・予定日時・lock_version を送り、成功したら通知して取り直す", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
      const { result } = await renderLoaded();

      let succeeded = false;
      await act(async () => {
        succeeded = await result.current.schedule(scheduledAt);
      });

      expect(succeeded).toBe(true);
      expect(apiClient.patch).toHaveBeenCalledWith(basePath, {
        status: "confirmed",
        scheduled_at: scheduledAt.toISOString(),
        lock_version: 3,
      });
      expect(showToastMock).toHaveBeenCalledWith({
        message: "面談の日程を確定しました",
        severity: "success",
      });
      expect(refetchCount()).toBe(1);
    });

    it("他の操作と競合した(409)ときは、バックエンドのメッセージを表示して最新の状態を取り直す", async () => {
      vi.mocked(apiClient.patch).mockRejectedValue(conflictError);
      const { result } = await renderLoaded();

      let succeeded = true;
      await act(async () => {
        succeeded = await result.current.schedule(scheduledAt);
      });

      expect(succeeded).toBe(false);
      expect(result.current.actionError).toBe(
        "他のユーザーによってデータが更新されています。再読み込みしてください",
      );
      expect(refetchCount()).toBe(1);
      expect(showToastMock).not.toHaveBeenCalled();
    });

    it("clearActionError でエラーを消せる", async () => {
      vi.mocked(apiClient.patch).mockRejectedValue(conflictError);
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.schedule(scheduledAt);
      });
      act(() => result.current.clearActionError());

      expect(result.current.actionError).toBe("");
    });

    it("401 のときはログイン画面に遷移する", async () => {
      vi.mocked(apiClient.patch).mockRejectedValue({
        response: { status: 401 },
      });
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.schedule(scheduledAt);
      });

      expect(pushMock).toHaveBeenCalledWith("/login");
      expect(result.current.actionError).toBe("");
    });
  });

  describe("完了", () => {
    it("完了ステータスと lock_version を送り、成功したら通知して取り直す", async () => {
      mockGet({ interview: { ...interview, status: "confirmed" } });
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
      const { result } = await renderLoaded();

      let succeeded = false;
      await act(async () => {
        succeeded = await result.current.complete();
      });

      expect(succeeded).toBe(true);
      expect(apiClient.patch).toHaveBeenCalledWith(basePath, {
        status: "completed",
        lock_version: 3,
      });
      expect(showToastMock).toHaveBeenCalledWith({
        message: "面談を完了にしました",
        severity: "success",
      });
      expect(refetchCount()).toBe(1);
    });

    it("失敗したときはエラーを表示する(メッセージが無ければ既定の文言)", async () => {
      vi.mocked(apiClient.patch).mockRejectedValue({
        response: { status: 500 },
      });
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.complete();
      });

      expect(result.current.actionError).toBe("面談の更新に失敗しました");
      // 状態が古いことによる失敗ではないので取り直さない
      expect(refetchCount()).toBe(0);
    });
  });

  describe("却下・キャンセル", () => {
    it("理由と lock_version を送る。生徒からの申請中なら「却下」として通知する", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: {} });
      const { result } = await renderLoaded();

      let succeeded = false;
      await act(async () => {
        succeeded = await result.current.cancel("日程が合わないため");
      });

      expect(succeeded).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith(basePath, {
        data: { reason: "日程が合わないため", lock_version: 3 },
      });
      expect(showToastMock).toHaveBeenCalledWith({
        message: "面談の申請を却下しました",
        severity: "success",
      });
      expect(refetchCount()).toBe(1);
    });

    it("それ以外は「キャンセル」として通知する", async () => {
      mockGet({ interview: { ...interview, status: "confirmed" } });
      vi.mocked(apiClient.delete).mockResolvedValue({ data: {} });
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.cancel("体調不良のため");
      });

      expect(showToastMock).toHaveBeenCalledWith({
        message: "面談をキャンセルしました",
        severity: "success",
      });
    });

    it("既に終了していた(422)ときは、エラーを表示して最新の状態を取り直す", async () => {
      vi.mocked(apiClient.delete).mockRejectedValue({
        response: {
          status: 422,
          data: { errors: ["進行中の面談のみキャンセルできます"] },
        },
      });
      const { result } = await renderLoaded();

      let succeeded = true;
      await act(async () => {
        succeeded = await result.current.cancel("理由");
      });

      expect(succeeded).toBe(false);
      expect(result.current.actionError).toBe(
        "進行中の面談のみキャンセルできます",
      );
      expect(refetchCount()).toBe(1);
    });
  });

  describe("メッセージの送信", () => {
    it("本文を送り、成功したら面談ごと取り直す(申請中→日程調整中に進み lock_version が変わるため)", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });
      const { result } = await renderLoaded();

      let succeeded = false;
      await act(async () => {
        succeeded = await result.current.sendMessage("来週はどうですか");
      });

      expect(succeeded).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(`${basePath}/messages`, {
        body: "来週はどうですか",
      });
      expect(refetchCount()).toBe(1);
    });

    it("面談が終了していた(422)ときは、エラーを表示して取り直す", async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: {
          status: 422,
          data: { errors: ["終了した面談にはメッセージを投稿できません"] },
        },
      });
      const { result } = await renderLoaded();

      let succeeded = true;
      await act(async () => {
        succeeded = await result.current.sendMessage("こんにちは");
      });

      expect(succeeded).toBe(false);
      expect(result.current.sendError).toBe(
        "終了した面談にはメッセージを投稿できません",
      );
      expect(refetchCount()).toBe(1);
    });

    it("失敗したときのメッセージが無ければ既定の文言を表示する", async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error("Network Error"));
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.sendMessage("こんにちは");
      });

      expect(result.current.sendError).toBe("メッセージの送信に失敗しました");
      expect(refetchCount()).toBe(0);
    });
  });
});
