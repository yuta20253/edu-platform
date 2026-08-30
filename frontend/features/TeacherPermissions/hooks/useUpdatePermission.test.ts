import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useUpdatePermission } from "./useUpdatePermission";
import { usePermissionForm } from "./usePermissionForm";
import type { PermissionTeacher } from "../types";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { patch: vi.fn() },
}));

const teacher: PermissionTeacher = {
  id: 2,
  name: "鈴木花子",
  teacher_permission: {
    id: 2,
    grade_scope: "own_grade",
    manage_other_teachers: false,
  },
};

function setup(onUpdated = vi.fn()) {
  return renderHook(() => {
    const form = usePermissionForm();
    const update = useUpdatePermission({ onUpdated, form });
    return { form, ...update };
  });
}

describe("useUpdatePermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handleEditClick で対象教員のフォーム値がセットされeditingTeacherが設定される", () => {
    const { result } = setup();
    act(() => result.current.handleEditClick(teacher));

    expect(result.current.editingTeacher).toEqual(teacher);
    expect(result.current.form.getValues()).toEqual({
      grade_scope: "own_grade",
      manage_other_teachers: false,
    });
  });

  it("handleDrawerClose でeditingTeacherがnullになる", () => {
    const { result } = setup();
    act(() => result.current.handleEditClick(teacher));
    act(() => result.current.handleDrawerClose());

    expect(result.current.editingTeacher).toBeNull();
  });

  it("handleUpdate 成功時はeditingTeacherをnullにしsnackbarを表示しonUpdatedを呼ぶ", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({});
    const onUpdated = vi.fn();
    const { result } = setup(onUpdated);
    act(() => result.current.handleEditClick(teacher));

    await act(async () => {
      await result.current.handleUpdate({
        grade_scope: "all_grades",
        manage_other_teachers: true,
      });
    });

    expect(apiClient.patch).toHaveBeenCalledWith(
      "/api/teacher/permissions/2",
      {
        teacher_permission: {
          grade_scope: "all_grades",
          manage_other_teachers: true,
        },
      },
    );
    expect(result.current.editingTeacher).toBeNull();
    expect(result.current.snackbar).toEqual({
      open: true,
      message: "権限を更新しました",
      severity: "success",
    });
    expect(onUpdated).toHaveBeenCalledTimes(1);
  });

  it("handleUpdate 失敗時はサーバのエラーがupdateErrorsにセットされeditingTeacherは維持される", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue({
      response: { status: 422, data: { errors: ["権限の更新に失敗しました"] } },
    });
    const { result } = setup();
    act(() => result.current.handleEditClick(teacher));

    await act(async () => {
      await result.current.handleUpdate({
        grade_scope: "all_grades",
        manage_other_teachers: true,
      });
    });

    expect(result.current.updateErrors).toEqual(["権限の更新に失敗しました"]);
    expect(result.current.editingTeacher).toEqual(teacher);
  });

  it("handleUpdate 失敗時にサーバのエラーメッセージがない場合はデフォルトメッセージになる", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue({
      response: { status: 500 },
    });
    const { result } = setup();
    act(() => result.current.handleEditClick(teacher));

    await act(async () => {
      await result.current.handleUpdate({
        grade_scope: "all_grades",
        manage_other_teachers: true,
      });
    });

    expect(result.current.updateErrors).toEqual(["権限の更新に失敗しました"]);
  });

  it("401エラー時はログイン画面へリダイレクトする", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue({
      response: { status: 401 },
    });
    const { result } = setup();
    act(() => result.current.handleEditClick(teacher));

    await act(async () => {
      await result.current.handleUpdate({
        grade_scope: "all_grades",
        manage_other_teachers: true,
      });
    });

    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("editingTeacherがnullのままhandleUpdateを呼んでもAPIを呼ばない", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.handleUpdate({
        grade_scope: "own_grade",
        manage_other_teachers: false,
      });
    });

    expect(apiClient.patch).not.toHaveBeenCalled();
  });

  it("handleSnackbarClose でsnackbar.openがfalseになる", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({});
    const { result } = setup();
    act(() => result.current.handleEditClick(teacher));
    await act(async () => {
      await result.current.handleUpdate({
        grade_scope: "own_grade",
        manage_other_teachers: false,
      });
    });

    act(() => result.current.handleSnackbarClose());

    expect(result.current.snackbar.open).toBe(false);
  });
});
