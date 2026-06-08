import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { AdminDetail } from "./types";

const mockAdmin: AdminDetail = {
  id: 1,
  name: "田中管理者",
  email: "tanaka@example.com",
  created_at: "2025-06-04T10:30:00.000Z",
  updated_at: "2025-06-05T10:30:00.000Z",
  activity_log: [],
};

const defaultProps = {
  admin: mockAdmin,
  isSelf: false,
  onUpdate: vi.fn(),
  updating: false,
  updateErrors: [] as string[],
  onPasswordReset: vi.fn(),
  resettingPassword: false,
  deleteDialogOpen: false,
  onDeleteClick: vi.fn(),
  onDeleteDialogClose: vi.fn(),
  onDeleteConfirm: vi.fn(),
  deleting: false,
  deleteErrors: [] as string[],
  snackbar: { open: false, message: "", severity: "success" as const },
  onSnackbarClose: vi.fn(),
};

describe("AdminAdminDetailPresenter", () => {
  it("名前・メール・登録日が読み取り表示される", () => {
    render(<Presenter {...defaultProps} />);
    // 名前はパンくず・見出しにも出るため、複数存在することだけ確認する
    expect(screen.getAllByText("田中管理者").length).toBeGreaterThan(0);
    expect(screen.getByText("tanaka@example.com")).toBeInTheDocument();
    expect(screen.getByText("2025/06/04")).toBeInTheDocument();
  });

  it("「編集」ボタンで入力フィールドと「保存」「キャンセル」が現れる", () => {
    render(<Presenter {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "編集" }));

    expect(screen.getByRole("textbox", { name: "名前" })).toHaveValue(
      "田中管理者",
    );
    expect(screen.getByRole("textbox", { name: "メールアドレス" })).toHaveValue(
      "tanaka@example.com",
    );
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "キャンセル" }),
    ).toBeInTheDocument();
  });

  it("編集して保存すると onUpdate が編集値で呼ばれる", async () => {
    const onUpdate = vi.fn();
    render(<Presenter {...defaultProps} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: "編集" }));

    fireEvent.change(screen.getByRole("textbox", { name: "名前" }), {
      target: { value: "鈴木管理者" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        name: "鈴木管理者",
        email: "tanaka@example.com",
      });
    });
  });

  it("「キャンセル」で編集モードが解除され読み取り表示に戻る", () => {
    render(<Presenter {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "編集" }));
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(
      screen.queryByRole("textbox", { name: "名前" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "編集" })).toBeInTheDocument();
  });

  it("updateErrors が Alert で表示される", () => {
    render(
      <Presenter
        {...defaultProps}
        updateErrors={["メールアドレスは既に使用されています"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "編集" }));
    expect(
      screen.getByText("メールアドレスは既に使用されています"),
    ).toBeInTheDocument();
  });

  it("パスワードリセットボタンで onPasswordReset が呼ばれる", () => {
    const onPasswordReset = vi.fn();
    render(<Presenter {...defaultProps} onPasswordReset={onPasswordReset} />);
    fireEvent.click(screen.getByRole("button", { name: "パスワードリセット" }));
    expect(onPasswordReset).toHaveBeenCalledTimes(1);
  });

  it("resettingPassword 中はパスワードリセットボタンが無効", () => {
    render(<Presenter {...defaultProps} resettingPassword />);
    expect(
      screen.getByRole("button", { name: "パスワードリセット" }),
    ).toBeDisabled();
  });

  it("アクティビティログの空状態が表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(
      screen.getByText("アクティビティはまだありません"),
    ).toBeInTheDocument();
  });

  it("危険操作カードの削除ボタンで onDeleteClick が呼ばれる", () => {
    const onDeleteClick = vi.fn();
    render(<Presenter {...defaultProps} onDeleteClick={onDeleteClick} />);
    fireEvent.click(screen.getByRole("button", { name: "この管理者を削除" }));
    expect(onDeleteClick).toHaveBeenCalledTimes(1);
  });

  it("deleteDialogOpen のとき確認ダイアログが表示され、確認ボタンは初期 disabled", () => {
    render(<Presenter {...defaultProps} deleteDialogOpen />);
    expect(screen.getByRole("button", { name: "削除する" })).toBeDisabled();
  });

  it("正確なメールを入力すると確認ボタンが有効化され onDeleteConfirm が呼ばれる", () => {
    const onDeleteConfirm = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        deleteDialogOpen
        onDeleteConfirm={onDeleteConfirm}
      />,
    );
    const confirmButton = screen.getByRole("button", { name: "削除する" });

    fireEvent.change(
      screen.getByRole("textbox", { name: "メールアドレスを入力" }),
      {
        target: { value: "wrong@example.com" },
      },
    );
    expect(confirmButton).toBeDisabled();

    fireEvent.change(
      screen.getByRole("textbox", { name: "メールアドレスを入力" }),
      {
        target: { value: "tanaka@example.com" },
      },
    );
    expect(confirmButton).toBeEnabled();

    fireEvent.click(confirmButton);
    expect(onDeleteConfirm).toHaveBeenCalledTimes(1);
  });

  it("isSelf のとき削除ボタンが無効で説明文が表示される", () => {
    render(<Presenter {...defaultProps} isSelf />);
    expect(
      screen.getByRole("button", { name: "この管理者を削除" }),
    ).toBeDisabled();
    expect(screen.getByText("自分自身は削除できません")).toBeInTheDocument();
  });

  it("snackbar.open のときメッセージが表示される", () => {
    render(
      <Presenter
        {...defaultProps}
        snackbar={{
          open: true,
          message: "管理者を更新しました",
          severity: "success",
        }}
      />,
    );
    expect(screen.getByText("管理者を更新しました")).toBeInTheDocument();
  });

  it("updating 中は保存ボタンが無効", () => {
    render(<Presenter {...defaultProps} updating />);
    fireEvent.click(screen.getByRole("button", { name: "編集" }));
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
  });
});
