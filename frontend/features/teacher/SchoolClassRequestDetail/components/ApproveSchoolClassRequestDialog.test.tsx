import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApproveSchoolClassRequestDialog } from "./ApproveSchoolClassRequestDialog";

const setup = (
  props: Partial<Parameters<typeof ApproveSchoolClassRequestDialog>[0]> = {},
) => {
  const onConfirm = vi.fn().mockResolvedValue(true);
  const onClose = vi.fn();
  render(
    <ApproveSchoolClassRequestDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
      error=""
      {...props}
    />,
  );
  return { onConfirm, onClose };
};

describe("ApproveSchoolClassRequestDialog", () => {
  it("承認すると、成功したら閉じる", async () => {
    const { onConfirm, onClose } = setup();

    expect(
      screen.getByRole("heading", { name: "申請を承認" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "承認する" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it("失敗したときは閉じずにエラーを表示する", async () => {
    const onConfirm = vi.fn().mockResolvedValue(false);
    const { onClose } = setup({
      onConfirm,
      error: "この申請はすでに処理されています。再読み込みしてください",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "この申請はすでに処理されています。再読み込みしてください",
    );
    fireEvent.click(screen.getByRole("button", { name: "承認する" }));

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
      onConfirm: vi.fn(() => new Promise<boolean>(() => {})),
    });

    fireEvent.click(screen.getByRole("button", { name: "承認する" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "承認する" })).toBeDisabled(),
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });
});
