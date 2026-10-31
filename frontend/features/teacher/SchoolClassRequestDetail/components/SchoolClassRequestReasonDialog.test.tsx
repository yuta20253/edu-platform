import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SchoolClassRequestReasonDialog } from "./SchoolClassRequestReasonDialog";

const setup = (
  props: Partial<Parameters<typeof SchoolClassRequestReasonDialog>[0]> = {},
) => {
  const onConfirm = vi.fn().mockResolvedValue(true);
  const onClose = vi.fn();
  render(
    <SchoolClassRequestReasonDialog
      open
      kind="reject"
      onClose={onClose}
      onConfirm={onConfirm}
      error=""
      {...props}
    />,
  );
  return { onConfirm, onClose };
};

describe("SchoolClassRequestReasonDialog", () => {
  describe("却下", () => {
    it("却下の文言で理由を入力させ、前後の空白を除いて送る", async () => {
      const { onConfirm, onClose } = setup();

      expect(
        screen.getByRole("heading", { name: "申請を却下" }),
      ).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(/却下理由/), {
        target: { value: "  同じ名前のクラスがあるため  " },
      });
      fireEvent.click(screen.getByRole("button", { name: "却下する" }));

      await waitFor(() =>
        expect(onConfirm).toHaveBeenCalledWith("同じ名前のクラスがあるため"),
      );
      expect(onClose).toHaveBeenCalled();
    });

    it("理由が空白だけのときは送信せず、エラーを表示する", async () => {
      const { onConfirm } = setup();

      fireEvent.change(screen.getByLabelText(/却下理由/), {
        target: { value: "   " },
      });
      fireEvent.click(screen.getByRole("button", { name: "却下する" }));

      expect(
        await screen.findByText("却下理由を入力してください"),
      ).toBeInTheDocument();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("理由が10000文字を超えるときは送信せず、エラーを表示する", async () => {
      const { onConfirm } = setup();

      fireEvent.change(screen.getByLabelText(/却下理由/), {
        target: { value: "あ".repeat(10001) },
      });
      fireEvent.click(screen.getByRole("button", { name: "却下する" }));

      expect(
        await screen.findByText("却下理由は10000文字以内で入力してください"),
      ).toBeInTheDocument();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe("取消", () => {
    it("取消の文言で、理由を入力せずに取り消せる", async () => {
      const { onConfirm, onClose } = setup({ kind: "cancel" });

      expect(
        screen.getByRole("heading", { name: "申請を取消" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/取消理由/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "取り消す" }));

      await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(""));
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("失敗したときは閉じずにエラーを表示する", async () => {
    const onConfirm = vi.fn().mockResolvedValue(false);
    const { onClose } = setup({
      kind: "cancel",
      onConfirm,
      error: "承認待ちの申請のみ取り消せます",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "承認待ちの申請のみ取り消せます",
    );
    fireEvent.click(screen.getByRole("button", { name: "取り消す" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("戻るで閉じる", () => {
    const { onClose } = setup();

    fireEvent.click(screen.getByRole("button", { name: "戻る" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("送信中は Esc で閉じない(結果のエラーを閉じた後に出さないため)", async () => {
    const { onClose } = setup({
      kind: "cancel",
      onConfirm: vi.fn(() => new Promise<boolean>(() => {})),
    });

    fireEvent.click(screen.getByRole("button", { name: "取り消す" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "取り消す" })).toBeDisabled(),
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });
});
