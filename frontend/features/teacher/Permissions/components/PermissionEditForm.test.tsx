import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import type { PermissionTeacherDetail } from "../types";
import { PermissionEditForm } from "./PermissionEditForm";

const pushMock = vi.fn();
const routerMock = { push: pushMock };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

// 一覧の行とは違う値(開いた時点で取り直した最新の値)
const detail: PermissionTeacherDetail = {
  id: 2,
  name: "鈴木花子",
  teacher_permission: {
    id: 2,
    grade_scope: "all_grades",
    manage_other_teachers: true,
    lock_version: 3,
  },
};

function setup(
  overrides: Partial<Parameters<typeof PermissionEditForm>[0]> = {},
) {
  const props = {
    teacherId: 2,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    updating: false,
    ...overrides,
  };
  render(<PermissionEditForm {...props} />);
  return props;
}

describe("PermissionEditForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 未消化のmockResolvedValueOnceが次のテストに漏れないようにする
    vi.mocked(apiClient.get).mockReset();
  });

  it("開くと対象教員の権限を取得し、取得中はスピナーで保存できない", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    setup();

    expect(vi.mocked(apiClient.get).mock.calls[0][0]).toBe(
      "/api/teacher/permissions/2",
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "保存" }),
    ).not.toBeInTheDocument();
  });

  it("取得した最新の値でフォームが初期化される", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: detail });
    setup();

    expect(await screen.findByRole("radio", { name: "全学年" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "自学年" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "有" })).toBeChecked();
  });

  it("保存すると、入力した値に取得時の lock_version を添えて onSubmit を呼ぶ", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: detail });
    const { onSubmit } = setup();

    fireEvent.click(await screen.findByRole("radio", { name: "自学年" }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        grade_scope: "own_grade",
        manage_other_teachers: true,
        lock_version: 3,
      });
    });
  });

  it("保存中は保存・キャンセルボタンが無効", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: detail });
    setup({ updating: true });

    expect(await screen.findByRole("button", { name: "保存" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeDisabled();
  });

  it("キャンセルで onCancel を呼ぶ", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: detail });
    const { onCancel } = setup();

    fireEvent.click(await screen.findByRole("button", { name: "キャンセル" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("404 のときは編集できない旨の案内だけを出し、再試行は出さない", async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 404 } });
    setup();

    expect(
      await screen.findByText("この教員の権限は編集できません"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "再試行" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "保存" }),
    ).not.toBeInTheDocument();
  });

  it("それ以外の失敗ではエラーを出し、再試行で取り直せる", async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: detail });
    setup();

    fireEvent.click(await screen.findByRole("button", { name: "再試行" }));

    expect(await screen.findByRole("radio", { name: "全学年" })).toBeChecked();
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });
});
