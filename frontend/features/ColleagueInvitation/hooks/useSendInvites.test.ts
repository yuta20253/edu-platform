import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useSendInvites } from "./useSendInvites";
import type { UnsentTeacher } from "../types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

const teachers: UnsentTeacher[] = [
  { id: 1, name: "山田太郎", name_kana: "ヤマダタロウ", email: "yamada@example.com" },
  { id: 2, name: "鈴木花子", name_kana: "スズキハナコ", email: "suzuki@example.com" },
];

describe("useSendInvites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handleToggleTeacher で選択状態がトグルされる", () => {
    const refetch = vi.fn(async () => {});
    const { result } = renderHook(() => useSendInvites({ teachers, refetch }));

    act(() => result.current.handleToggleTeacher(1));
    expect(result.current.selectedTeacherIds).toEqual([1]);

    act(() => result.current.handleToggleTeacher(1));
    expect(result.current.selectedTeacherIds).toEqual([]);
  });

  it("全教員を選択済みのときallSelectedがtrueになる", () => {
    const refetch = vi.fn(async () => {});
    const { result } = renderHook(() => useSendInvites({ teachers, refetch }));

    act(() => result.current.handleToggleTeacher(1));
    expect(result.current.allSelected).toBe(false);

    act(() => result.current.handleToggleTeacher(2));
    expect(result.current.allSelected).toBe(true);
  });

  it("teachers が空のときallSelectedはfalse", () => {
    const refetch = vi.fn(async () => {});
    const { result } = renderHook(() =>
      useSendInvites({ teachers: [], refetch }),
    );
    expect(result.current.allSelected).toBe(false);
  });

  it("handleToggleAll で全選択・全解除ができる", () => {
    const refetch = vi.fn(async () => {});
    const { result } = renderHook(() => useSendInvites({ teachers, refetch }));

    act(() => result.current.handleToggleAll());
    expect(result.current.selectedTeacherIds).toEqual([1, 2]);

    act(() => result.current.handleToggleAll());
    expect(result.current.selectedTeacherIds).toEqual([]);
  });

  it("未選択のままhandleSendInvitesを呼んでもAPIは呼ばれない", async () => {
    const refetch = vi.fn(async () => {});
    const { result } = renderHook(() => useSendInvites({ teachers, refetch }));

    await act(async () => {
      await result.current.handleSendInvites();
    });

    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("送信が成功(202)するとsuccessMessageをセットし選択をクリアしrefetchする", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ status: 202 });
    const refetch = vi.fn(async () => {});
    const { result } = renderHook(() => useSendInvites({ teachers, refetch }));

    act(() => result.current.handleToggleTeacher(1));

    await act(async () => {
      await result.current.handleSendInvites();
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/teacher/teacher_notifications",
      { teacher_ids: [1] },
    );
    expect(result.current.successMessage).toBe("招待の送信を開始しました。");
    expect(result.current.selectedTeacherIds).toEqual([]);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("送信に失敗するとsubmitErrorがセットされる", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { status: 500 },
    });
    const refetch = vi.fn(async () => {});
    const { result } = renderHook(() => useSendInvites({ teachers, refetch }));

    act(() => result.current.handleToggleTeacher(1));

    await act(async () => {
      await result.current.handleSendInvites();
    });

    expect(result.current.submitError).toBe(
      "招待送信に失敗しました。もう一度お試しください。",
    );
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { status: 401 },
    });
    const refetch = vi.fn(async () => {});
    const { result } = renderHook(() => useSendInvites({ teachers, refetch }));

    act(() => result.current.handleToggleTeacher(1));

    await act(async () => {
      await result.current.handleSendInvites();
    });

    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
