import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

const defaultProps = {
  open: true,
  title: "管理者を削除",
  description: "この操作は取り消せません。",
  confirmText: "admin@example.com",
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  loading: false,
  errors: [] as string[],
};

describe("ConfirmDeleteDialog", () => {
  it("titleとdescriptionが表示される", () => {
    render(<ConfirmDeleteDialog {...defaultProps} />);
    expect(screen.getByText("管理者を削除")).toBeInTheDocument();
    expect(screen.getByText("この操作は取り消せません。")).toBeInTheDocument();
  });

  it("confirmTextが未入力のとき削除ボタンは無効", () => {
    render(<ConfirmDeleteDialog {...defaultProps} />);
    expect(screen.getByRole("button", { name: "削除する" })).toBeDisabled();
  });

  it("confirmTextと一致しない入力では削除ボタンは無効のまま", () => {
    render(<ConfirmDeleteDialog {...defaultProps} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "wrong@example.com" },
    });
    expect(screen.getByRole("button", { name: "削除する" })).toBeDisabled();
  });

  it("confirmTextと一致すると削除ボタンが有効になりonConfirmを呼べる", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDeleteDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "admin@example.com" },
    });
    const deleteButton = screen.getByRole("button", { name: "削除する" });
    expect(deleteButton).not.toBeDisabled();
    fireEvent.click(deleteButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("loading中は削除ボタンが無効", () => {
    render(<ConfirmDeleteDialog {...defaultProps} loading />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "admin@example.com" },
    });
    expect(screen.getByRole("button", { name: "削除する" })).toBeDisabled();
  });

  it("errorsが渡されるとエラー一覧が表示される", () => {
    render(
      <ConfirmDeleteDialog
        {...defaultProps}
        errors={["削除に失敗しました", "権限がありません"]}
      />,
    );
    expect(screen.getByText("削除に失敗しました")).toBeInTheDocument();
    expect(screen.getByText("権限がありません")).toBeInTheDocument();
  });

  it("キャンセルを押すとonCloseが呼ばれる", () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("openがfalseのとき何も表示されない", () => {
    render(<ConfirmDeleteDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("管理者を削除")).not.toBeInTheDocument();
  });
});
