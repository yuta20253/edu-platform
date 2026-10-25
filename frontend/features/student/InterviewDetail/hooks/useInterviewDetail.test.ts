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
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const interview = {
  id: 1,
  status: "requested",
  lock_version: 3,
  student_id: 10,
  teacher_id: 20,
};
const message = {
  id: 100,
  body: "よろしくお願いします",
  sender_id: 10,
  sender_name: "生徒太郎",
  created_at: "2026-10-01T10:00:00+09:00",
};

const mockGet = (overrides: { interview?: object } = {}) => {
  vi.mocked(apiClient.get).mockImplementation((url: string) => {
    if (url.endsWith("/messages")) {
      return Promise.resolve({
        data: { interview_request_messages: [message], meta: {} },
      });
    }
    return Promise.resolve({ data: overrides.interview ?? interview });
  });
};

const renderLoaded = async () => {
  const hook = renderHook(() => useInterviewDetail("1"));
  await waitFor(() => expect(hook.result.current.interview).not.toBeNull());
  return hook;
};

describe("useInterviewDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet();
  });

  describe("取得", () => {
    it("面談とメッセージを取得する", async () => {
      const { result } = await renderLoaded();

      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/student/interview-requests/1",
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/student/interview-requests/1/messages",
        { params: { page: "1", per_page: "100" } },
      );
      expect(result.current.interview).toEqual(interview);
      expect(result.current.messages).toEqual([message]);
      expect(result.current.error).toBe(false);
    });

    it("メッセージが複数ページにわたるときは全ページを取得して古い順に並べる", async () => {
      const second = { ...message, id: 101, body: "2ページ目" };
      vi.mocked(apiClient.get).mockImplementation(
        (url: string, config?: { params?: { page?: string } }) => {
          if (!url.endsWith("/messages")) {
            return Promise.resolve({ data: interview });
          }
          const page = config?.params?.page;
          return Promise.resolve({
            data: {
              interview_request_messages: page === "2" ? [second] : [message],
              meta: { current_page: Number(page), total_pages: 2 },
            },
          });
        },
      );

      const { result } = await renderLoaded();

      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/student/interview-requests/1/messages",
        { params: { page: "2", per_page: "100" } },
      );
      expect(result.current.messages).toEqual([message, second]);
    });

    it("401 のときはログイン画面へ遷移する", async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { status: 401 },
      });
      renderHook(() => useInterviewDetail("1"));

      await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    });

    it("その他のエラーのときは error を true にする", async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { status: 404 },
      });
      const { result } = renderHook(() => useInterviewDetail("1"));

      await waitFor(() => expect(result.current.error).toBe(true));
      expect(result.current.interview).toBeNull();
    });
  });

  describe("メッセージ送信", () => {
    it("本文を送信し、成功したら面談とメッセージを再取得して true を返す", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: message });
      const { result } = await renderLoaded();
      vi.mocked(apiClient.get).mockClear();

      let succeeded = false;
      await act(async () => {
        succeeded = await result.current.sendMessage("こんにちは");
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/student/interview-requests/1/messages",
        { body: "こんにちは" },
      );
      expect(succeeded).toBe(true);
      // メッセージ送信でステータス・lock_versionが変わりうるため面談も取り直す
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/student/interview-requests/1",
      );
      expect(result.current.sendError).toBe("");
    });

    it("失敗したときは sendError にエラー内容をセットして false を返す", async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { status: 422, data: { errors: ["本文を入力してください"] } },
      });
      const { result } = await renderLoaded();

      let succeeded = true;
      await act(async () => {
        succeeded = await result.current.sendMessage("");
      });

      expect(succeeded).toBe(false);
      expect(result.current.sendError).toBe("本文を入力してください");
    });

    it("422(面談が終了済み等)のときは最新の面談を取り直す", async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: {
          status: 422,
          data: { errors: ["終了した面談にはメッセージを送信できません"] },
        },
      });
      const { result } = await renderLoaded();
      mockGet({
        interview: { ...interview, status: "cancelled", lock_version: 4 },
      });

      await act(async () => {
        await result.current.sendMessage("こんにちは");
      });

      await waitFor(() =>
        expect(result.current.interview?.status).toBe("cancelled"),
      );
    });

    it("409・422 以外の失敗のときは再取得しない", async () => {
      vi.mocked(apiClient.post).mockRejectedValue({
        response: { status: 500 },
      });
      const { result } = await renderLoaded();
      vi.mocked(apiClient.get).mockClear();

      await act(async () => {
        await result.current.sendMessage("こんにちは");
      });

      expect(result.current.sendError).toBe("メッセージの送信に失敗しました");
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  describe("キャンセル", () => {
    it("理由と取得時の lock_version を送信し、成功したらトーストを出して再取得し true を返す", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { message: "面談をキャンセルしました" },
      });
      const { result } = await renderLoaded();
      vi.mocked(apiClient.get).mockClear();

      let succeeded = false;
      await act(async () => {
        succeeded = await result.current.cancel("都合が悪くなった");
      });

      expect(apiClient.delete).toHaveBeenCalledWith(
        "/api/student/interview-requests/1",
        { data: { reason: "都合が悪くなった", lock_version: 3 } },
      );
      expect(succeeded).toBe(true);
      expect(showToastMock).toHaveBeenCalledWith({
        message: "面談をキャンセルしました",
        severity: "success",
      });
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/student/interview-requests/1",
      );
    });

    it("409(楽観ロックの競合)のときは cancelError にバックエンドのメッセージをセットし、最新の面談を取り直す", async () => {
      const conflict =
        "他のユーザーによってデータが更新されています。再読み込みしてください";
      vi.mocked(apiClient.delete).mockRejectedValue({
        response: { status: 409, data: { errors: [conflict] } },
      });
      const { result } = await renderLoaded();
      mockGet({
        interview: { ...interview, status: "scheduling", lock_version: 4 },
      });

      let succeeded = true;
      await act(async () => {
        succeeded = await result.current.cancel("都合が悪くなった");
      });

      expect(succeeded).toBe(false);
      expect(result.current.cancelError).toBe(conflict);
      await waitFor(() =>
        expect(result.current.interview?.lock_version).toBe(4),
      );
    });

    it("422(先生が先にキャンセルした等)のときも cancelError をセットし、最新の面談を取り直す", async () => {
      vi.mocked(apiClient.delete).mockRejectedValue({
        response: {
          status: 422,
          data: { errors: ["進行中の面談のみキャンセルできます"] },
        },
      });
      const { result } = await renderLoaded();
      mockGet({
        interview: { ...interview, status: "cancelled", lock_version: 4 },
      });

      await act(async () => {
        await result.current.cancel("都合が悪くなった");
      });

      expect(result.current.cancelError).toBe(
        "進行中の面談のみキャンセルできます",
      );
      await waitFor(() =>
        expect(result.current.interview?.status).toBe("cancelled"),
      );
    });

    it("409・422 以外の失敗のときは cancelError をセットし再取得しない", async () => {
      vi.mocked(apiClient.delete).mockRejectedValue({
        response: { status: 500 },
      });
      const { result } = await renderLoaded();
      vi.mocked(apiClient.get).mockClear();

      await act(async () => {
        await result.current.cancel("都合が悪くなった");
      });

      expect(result.current.cancelError).toBe("面談のキャンセルに失敗しました");
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it("clearCancelError で cancelError を消せる", async () => {
      vi.mocked(apiClient.delete).mockRejectedValue({
        response: { status: 500 },
      });
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.cancel("都合が悪くなった");
      });
      expect(result.current.cancelError).toBe("面談のキャンセルに失敗しました");

      act(() => result.current.clearCancelError());
      expect(result.current.cancelError).toBe("");
    });
  });
});
