import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { useUpdatePermission } from "./useUpdatePermission";
import type { PermissionTeacher, UpdatePermissionPayload } from "../types";

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

const payload: UpdatePermissionPayload = {
  grade_scope: "all_grades",
  manage_other_teachers: true,
  lock_version: 3,
};

function setup(onUpdated = vi.fn()) {
  return renderHook(() => useUpdatePermission({ onUpdated }));
}

describe("useUpdatePermission", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("handleEditClick でeditingTeacherが設定される", () => {
    const { result } = setup();
    act(() => result.current.handleEditClick(teacher));

    expect(result.current.editingTeacher).toEqual(teacher);
  });

  it("handleEditClick のたびにformKeyが増える(同じ教員を開き直しても作り直す)", () => {
    const { result } = setup();
    const initial = result.current.formKey;

    act(() => result.current.handleEditClick(teacher));
    act(() => result.current.handleDrawerClose());
    act(() => result.current.handleEditClick(teacher));

    expect(result.current.formKey).toBe(initial + 2);
  });

  it("handleDrawerClose でeditingTeacherがnullになる", () => {
    const { result } = setup();
    act(() => result.current.handleEditClick(teacher));
    act(() => result.current.handleDrawerClose());

    expect(result.current.editingTeacher).toBeNull();
  });

  it("handleUpdate はlock_versionを添えてPATCHし、成功時はeditingTeacherをnullにしsnackbarを表示しonUpdatedを呼ぶ", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({});
    const onUpdated = vi.fn();
    const { result } = setup(onUpdated);
    act(() => result.current.handleEditClick(teacher));

    await act(async () => {
      await result.current.handleUpdate(payload);
    });

    expect(apiClient.patch).toHaveBeenCalledWith("/api/teacher/permissions/2", {
      teacher_permission: {
        grade_scope: "all_grades",
        manage_other_teachers: true,
        lock_version: 3,
      },
    });
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
      response: { status: 422, data: { errors: ["自分自身は更新できません"] } },
    });
    const { result } = setup();
    act(() => result.current.handleEditClick(teacher));

    await act(async () => {
      await result.current.handleUpdate(payload);
    });

    expect(result.current.updateErrors).toEqual(["自分自身は更新できません"]);
    expect(result.current.editingTeacher).toEqual(teacher);
  });

  it("handleUpdate 失敗時にサーバのエラーメッセージがない場合はデフォルトメッセージになる", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue({
      response: { status: 500 },
    });
    const { result } = setup();
    act(() => result.current.handleEditClick(teacher));

    await act(async () => {
      await result.current.handleUpdate(payload);
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
      await result.current.handleUpdate(payload);
    });

    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("409(ほかの人が先に変更)のときは、案内を出し、formKeyを増やしてフォームを作り直し、一覧を取り直す", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue({
      response: {
        status: 409,
        data: {
          errors: [
            "他のユーザーによってデータが更新されています。再読み込みしてください",
          ],
        },
      },
    });
    const onUpdated = vi.fn();
    const { result } = setup(onUpdated);
    act(() => result.current.handleEditClick(teacher));
    const keyBefore = result.current.formKey;

    await act(async () => {
      await result.current.handleUpdate(payload);
    });

    // Railsの「再読み込みしてください」ではなく、自動で取り直す挙動に合った文言にする
    expect(result.current.updateErrors).toEqual([
      "ほかの人が先にこの教員の権限を変更しました。最新の内容を確認して、保存し直してください",
    ]);
    expect(result.current.formKey).toBe(keyBefore + 1);
    expect(result.current.editingTeacher).toEqual(teacher);
    expect(onUpdated).toHaveBeenCalledTimes(1);
  });

  it("403(開いている間に自分の権限が外された)のときは、ドロワーを閉じてsnackbarでRailsの文言を出し、一覧を取り直す", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue({
      response: {
        status: 403,
        data: { errors: ["他教員を編集する権限がありません"] },
      },
    });
    const onUpdated = vi.fn();
    const { result } = setup(onUpdated);
    act(() => result.current.handleEditClick(teacher));

    await act(async () => {
      await result.current.handleUpdate(payload);
    });

    expect(result.current.editingTeacher).toBeNull();
    expect(result.current.updateErrors).toEqual([]);
    expect(result.current.snackbar).toEqual({
      open: true,
      message: "他教員を編集する権限がありません",
      severity: "error",
    });
    expect(onUpdated).toHaveBeenCalledTimes(1);
  });

  it("404(対象の教員が見つからない)のときは、編集できない旨の案内を出し、一覧は取り直さない", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue({
      response: { status: 404, data: { message: "ユーザーが見つかりません" } },
    });
    const onUpdated = vi.fn();
    const { result } = setup(onUpdated);
    act(() => result.current.handleEditClick(teacher));

    await act(async () => {
      await result.current.handleUpdate(payload);
    });

    expect(result.current.updateErrors).toEqual([
      "この教員の権限は編集できません",
    ]);
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it("409のあとに別の教員を開くと、前の案内は消える", async () => {
    vi.mocked(apiClient.patch).mockRejectedValue({
      response: { status: 409, data: { errors: ["競合"] } },
    });
    const { result } = setup();
    act(() => result.current.handleEditClick(teacher));
    await act(async () => {
      await result.current.handleUpdate(payload);
    });

    act(() => result.current.handleDrawerClose());
    act(() => result.current.handleEditClick({ ...teacher, id: 3 }));

    expect(result.current.updateErrors).toEqual([]);
  });

  it("editingTeacherがnullのままhandleUpdateを呼んでもAPIを呼ばない", async () => {
    const { result } = setup();

    await act(async () => {
      await result.current.handleUpdate(payload);
    });

    expect(apiClient.patch).not.toHaveBeenCalled();
  });

  it("handleSnackbarClose でsnackbar.openがfalseになる", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({});
    const { result } = setup();
    act(() => result.current.handleEditClick(teacher));
    await act(async () => {
      await result.current.handleUpdate(payload);
    });

    act(() => result.current.handleSnackbarClose());

    expect(result.current.snackbar.open).toBe(false);
  });
});
