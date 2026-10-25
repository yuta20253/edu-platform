import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompleteInterviewDialog } from "./CompleteInterviewDialog";

describe("CompleteInterviewDialog", () => {
  it("完了にすると onConfirm を呼び、成功したら閉じる", async () => {
    const onConfirm = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(
      <CompleteInterviewDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        error=""
      />,
    );

    expect(screen.getByRole("dialog")).toHaveTextContent(
      "面談を完了にしますか",
    );
    fireEvent.click(screen.getByRole("button", { name: "完了にする" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it("失敗したときは閉じずにエラーを表示する", async () => {
    const onConfirm = vi.fn().mockResolvedValue(false);
    const onClose = vi.fn();
    render(
      <CompleteInterviewDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        error="他のユーザーによってデータが更新されています。再読み込みしてください"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "他のユーザーによってデータが更新されています",
    );
    fireEvent.click(screen.getByRole("button", { name: "完了にする" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });
});
