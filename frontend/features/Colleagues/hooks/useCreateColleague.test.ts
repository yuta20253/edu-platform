import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useCreateColleague } from "./useCreateColleague";
import type { CreateTeacherInput } from "../types";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { post: vi.fn() },
}));

const input: CreateTeacherInput = {
  name: "山田太郎",
  name_kana: "ヤマダタロウ",
  email: "yamada@example.com",
  grade_id: 1,
  grade_scope: "own_grade",
  manage_other_teachers: false,
};

const formMock = {
  reset: vi.fn(),
} as unknown as Parameters<typeof useCreateColleague>[0]["form"];

describe("useCreateColleague", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handleAddClick でフォームをリセットしdrawerを開く", () => {
    const onCreated = vi.fn();
    const { result } = renderHook(() =>
      useCreateColleague({ onCreated, form: formMock }),
    );

    act(() => result.current.handleAddClick());

    expect(formMock.reset).toHaveBeenCalled();
    expect(result.current.drawerOpen).toBe(true);
  });

  it("handleCreate が成功するとdrawerを閉じsnackbarを表示しonCreatedを呼ぶ", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({});
    const onCreated = vi.fn();
    const { result } = renderHook(() =>
      useCreateColleague({ onCreated, form: formMock }),
    );

    await act(async () => {
      await result.current.handleCreate(input);
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/teacher/colleagues",
      input,
    );
    expect(result.current.drawerOpen).toBe(false);
    expect(result.current.snackbar).toEqual({
      open: true,
      message: "管理者を追加しました",
      severity: "success",
    });
    expect(onCreated).toHaveBeenCalledTimes(1);
  });

  it("handleCreate が失敗するとcreateErrorsをセットする", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: {
        status: 422,
        data: { errors: ["メールアドレスは既に使用されています"] },
      },
    });
    const onCreated = vi.fn();
    const { result } = renderHook(() =>
      useCreateColleague({ onCreated, form: formMock }),
    );

    await act(async () => {
      await result.current.handleCreate(input);
    });

    expect(result.current.createErrors).toEqual([
      "メールアドレスは既に使用されています",
    ]);
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.post).mockRejectedValue({
      response: { status: 401 },
    });
    const { result } = renderHook(() =>
      useCreateColleague({ onCreated: vi.fn(), form: formMock }),
    );

    await act(async () => {
      await result.current.handleCreate(input);
    });

    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("handleDrawerClose でフォームをリセットしdrawerを閉じる", () => {
    const { result } = renderHook(() =>
      useCreateColleague({ onCreated: vi.fn(), form: formMock }),
    );

    act(() => result.current.handleAddClick());
    act(() => result.current.handleDrawerClose());

    expect(result.current.drawerOpen).toBe(false);
  });

  it("handleSnackbarClose でsnackbarを閉じる", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({});
    const { result } = renderHook(() =>
      useCreateColleague({ onCreated: vi.fn(), form: formMock }),
    );

    await act(async () => {
      await result.current.handleCreate(input);
    });
    act(() => result.current.handleSnackbarClose());

    expect(result.current.snackbar.open).toBe(false);
  });
});
