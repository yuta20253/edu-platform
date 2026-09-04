import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useTeacherInvitations } from "./useTeacherInvitations";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("useTeacherInvitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未招待教員一覧を取得しdataにセットする", async () => {
    const teachers = [
      {
        id: 1,
        name: "山田太郎",
        name_kana: "ヤマダタロウ",
        email: "yamada@example.com",
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValue({ data: teachers });

    const { result } = renderHook(() => useTeacherInvitations());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(teachers);
    expect(result.current.error).toBeNull();
    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/teacher/teacher_notifications",
    );
  });

  it("取得に失敗するとerrorメッセージがセットされる", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useTeacherInvitations());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(
      "未招待の教員一覧の取得に失敗しました。ページを再読み込みしてください。",
    );
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useTeacherInvitations());

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("refetch を呼ぶと再取得する", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useTeacherInvitations());
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.refetch();
    });

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });
});
