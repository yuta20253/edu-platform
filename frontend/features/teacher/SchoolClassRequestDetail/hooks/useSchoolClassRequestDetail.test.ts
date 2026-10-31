import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useSchoolClassRequestDetail } from "./useSchoolClassRequestDetail";

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
  apiClient: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const basePath = "/api/teacher/school-class-requests/1";

const request = {
  id: 1,
  action: "creation",
  status: "pending",
  lock_version: 3,
};

const conflictError = {
  response: {
    status: 409,
    data: {
      errors: ["この申請はすでに処理されています。再読み込みしてください"],
    },
  },
};

const mockGet = (data: object = request) =>
  vi.mocked(apiClient.get).mockResolvedValue({ data });

const renderLoaded = async () => {
  const hook = renderHook(() => useSchoolClassRequestDetail(1));
  await waitFor(() => expect(hook.result.current.request).not.toBeNull());
  return hook;
};

// 初回の取得を除いた、操作後の取り直しの回数
const refetchCount = () => vi.mocked(apiClient.get).mock.calls.length - 1;

describe("useSchoolClassRequestDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet();
  });

  describe("取得", () => {
    it("学級申請を取得する", async () => {
      const { result } = await renderLoaded();

      expect(apiClient.get).toHaveBeenCalledWith(basePath);
      expect(result.current.request).toEqual(request);
      expect(result.current.error).toBe(false);
    });

    it("取得に失敗すると error が true になり、retry で取り直せる", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce({
        response: { status: 500 },
      });
      const { result } = renderHook(() => useSchoolClassRequestDetail(1));

      await waitFor(() => expect(result.current.error).toBe(true));
      expect(result.current.request).toBeNull();

      await act(async () => {
        await result.current.retry();
      });

      expect(result.current.request).toEqual(request);
      expect(result.current.error).toBe(false);
    });

    it("取得が重なって古い結果が後から届いても、最後に出した取得の結果を残す", async () => {
      const { result } = await renderLoaded();

      // 1回目の取り直しは遅く(lock_version: 5)、2回目は先に返る(lock_version: 6)
      let resolveSlow: (value: { data: object }) => void = () => {};
      const slow = new Promise<{ data: object }>((resolve) => {
        resolveSlow = resolve;
      });
      vi.mocked(apiClient.get)
        .mockReturnValueOnce(slow)
        .mockResolvedValueOnce({ data: { ...request, lock_version: 6 } });

      let first: Promise<void> = Promise.resolve();
      await act(async () => {
        first = result.current.retry();
        await result.current.retry();
      });
      expect(result.current.request?.lock_version).toBe(6);

      await act(async () => {
        resolveSlow({ data: { ...request, lock_version: 5 } });
        await first;
      });

      expect(result.current.request?.lock_version).toBe(6);
    });

    it("401 のときはログイン画面に遷移し、エラーにしない", async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        response: { status: 401 },
      });
      const { result } = renderHook(() => useSchoolClassRequestDetail(1));

      await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
      expect(result.current.error).toBe(false);
    });
  });

  describe("承認", () => {
    it("承認ステータスと lock_version を送り、成功したら通知して取り直す", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
      const { result } = await renderLoaded();

      let succeeded = false;
      await act(async () => {
        succeeded = await result.current.approve();
      });

      expect(succeeded).toBe(true);
      expect(apiClient.patch).toHaveBeenCalledWith(basePath, {
        status: "approved",
        lock_version: 3,
      });
      expect(showToastMock).toHaveBeenCalledWith({
        message: "申請を承認しました",
        severity: "success",
      });
      expect(refetchCount()).toBe(1);
    });

    it("他の教員が先に処理していた(409)ときは、バックエンドのメッセージを表示して最新の状態を取り直す", async () => {
      vi.mocked(apiClient.patch).mockRejectedValue(conflictError);
      const { result } = await renderLoaded();

      let succeeded = true;
      await act(async () => {
        succeeded = await result.current.approve();
      });

      expect(succeeded).toBe(false);
      expect(result.current.actionError).toBe(
        "この申請はすでに処理されています。再読み込みしてください",
      );
      expect(refetchCount()).toBe(1);
      expect(showToastMock).not.toHaveBeenCalled();
    });

    it("失敗したときのメッセージが無ければ既定の文言を表示する", async () => {
      vi.mocked(apiClient.patch).mockRejectedValue({
        response: { status: 500 },
      });
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.approve();
      });

      expect(result.current.actionError).toBe("申請の承認に失敗しました");
      // 状態が古いことによる失敗ではないので取り直さない
      expect(refetchCount()).toBe(0);
    });

    it("clearActionError でエラーを消せる", async () => {
      vi.mocked(apiClient.patch).mockRejectedValue(conflictError);
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.approve();
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
        await result.current.approve();
      });

      expect(pushMock).toHaveBeenCalledWith("/login");
      expect(result.current.actionError).toBe("");
    });
  });

  describe("却下", () => {
    it("却下ステータス・理由・lock_version を送り、成功したら通知して取り直す", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} });
      const { result } = await renderLoaded();

      let succeeded = false;
      await act(async () => {
        succeeded = await result.current.reject("同じ名前のクラスがあるため");
      });

      expect(succeeded).toBe(true);
      expect(apiClient.patch).toHaveBeenCalledWith(basePath, {
        status: "rejected",
        lock_version: 3,
        reason: "同じ名前のクラスがあるため",
      });
      expect(showToastMock).toHaveBeenCalledWith({
        message: "申請を却下しました",
        severity: "success",
      });
      expect(refetchCount()).toBe(1);
    });

    it("他の教員が先に処理していた(409)ときは、エラーを表示して取り直す", async () => {
      vi.mocked(apiClient.patch).mockRejectedValue(conflictError);
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.reject("理由");
      });

      expect(result.current.actionError).toBe(
        "この申請はすでに処理されています。再読み込みしてください",
      );
      expect(refetchCount()).toBe(1);
    });

    it("失敗したときのメッセージが無ければ既定の文言を表示する", async () => {
      vi.mocked(apiClient.patch).mockRejectedValue(new Error("Network Error"));
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.reject("理由");
      });

      expect(result.current.actionError).toBe("申請の却下に失敗しました");
    });
  });

  describe("取消", () => {
    it("理由を送り、成功したら通知して取り直す", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: {} });
      const { result } = await renderLoaded();

      let succeeded = false;
      await act(async () => {
        succeeded = await result.current.cancel("申請先のクラスを間違えたため");
      });

      expect(succeeded).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith(basePath, {
        data: { reason: "申請先のクラスを間違えたため" },
      });
      expect(showToastMock).toHaveBeenCalledWith({
        message: "申請を取り消しました",
        severity: "success",
      });
      expect(refetchCount()).toBe(1);
    });

    it("既に処理されていた(422)ときは、エラーを表示して最新の状態を取り直す", async () => {
      vi.mocked(apiClient.delete).mockRejectedValue({
        response: {
          status: 422,
          data: { errors: ["承認待ちの申請のみ取り消せます"] },
        },
      });
      const { result } = await renderLoaded();

      let succeeded = true;
      await act(async () => {
        succeeded = await result.current.cancel("");
      });

      expect(succeeded).toBe(false);
      expect(result.current.actionError).toBe("承認待ちの申請のみ取り消せます");
      expect(refetchCount()).toBe(1);
    });

    it("失敗したときのメッセージが無ければ既定の文言を表示する", async () => {
      vi.mocked(apiClient.delete).mockRejectedValue({
        response: { status: 500 },
      });
      const { result } = await renderLoaded();

      await act(async () => {
        await result.current.cancel("");
      });

      expect(result.current.actionError).toBe("申請の取消に失敗しました");
      expect(refetchCount()).toBe(0);
    });
  });
});
