import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CancelInterviewDialog } from "./CancelInterviewDialog";

const setup = (
  props: Partial<Parameters<typeof CancelInterviewDialog>[0]> = {},
) => {
  const onConfirm = vi.fn().mockResolvedValue(true);
  const onClose = vi.fn();
  render(
    <CancelInterviewDialog
      open
      kind="cancel"
      onClose={onClose}
      onConfirm={onConfirm}
      error=""
      {...props}
    />,
  );
  return { onConfirm, onClose };
};

describe("CancelInterviewDialog", () => {
  it("キャンセルのときは、キャンセルの文言で理由を入力させる", async () => {
    const { onConfirm, onClose } = setup();

    expect(
      screen.getByRole("heading", { name: "面談をキャンセル" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("キャンセル理由"), {
      target: { value: "  体調不良のため  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "キャンセルする" }));

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith("体調不良のため"),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("却下のときは、却下の文言で理由を入力させる", async () => {
    const { onConfirm } = setup({ kind: "reject" });

    expect(
      screen.getByRole("heading", { name: "面談の申請を却下" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("却下理由"), {
      target: { value: "担当外の相談のため" },
    });
    fireEvent.click(screen.getByRole("button", { name: "却下する" }));

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith("担当外の相談のため"),
    );
  });

  it("理由が空白だけのときは送信せず、エラーを表示する", async () => {
    const { onConfirm } = setup();

    fireEvent.change(screen.getByLabelText("キャンセル理由"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "キャンセルする" }));

    expect(
      await screen.findByText("キャンセル理由を入力してください"),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("失敗したときは閉じずにエラーを表示する", async () => {
    const onConfirm = vi.fn().mockResolvedValue(false);
    const { onClose } = setup({
      onConfirm,
      error: "進行中の面談のみキャンセルできます",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "進行中の面談のみキャンセルできます",
    );
    fireEvent.change(screen.getByLabelText("キャンセル理由"), {
      target: { value: "理由" },
    });
    fireEvent.click(screen.getByRole("button", { name: "キャンセルする" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("戻るで閉じる", () => {
    const { onClose } = setup();

    fireEvent.click(screen.getByRole("button", { name: "戻る" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("送信していないときは Esc で閉じる", () => {
    const { onClose } = setup();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });

  it("送信中は Esc で閉じない(結果のエラーを閉じた後に出さないため)", async () => {
    const { onClose } = setup({
      onConfirm: vi.fn(() => new Promise<boolean>(() => {})),
    });

    fireEvent.change(screen.getByLabelText("キャンセル理由"), {
      target: { value: "理由" },
    });
    fireEvent.click(screen.getByRole("button", { name: "キャンセルする" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "キャンセルする" }),
      ).toBeDisabled(),
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });
});
