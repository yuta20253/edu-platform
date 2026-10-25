import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScheduleInterviewDialog } from "./ScheduleInterviewDialog";

vi.mock("@mui/x-date-pickers/DateTimePicker", () => ({
  DateTimePicker: ({
    value,
    onChange,
    slotProps,
  }: {
    value: Date | null;
    onChange: (date: Date | null) => void;
    slotProps?: { textField?: { helperText?: string } };
  }) => (
    <div>
      <input
        aria-label="予定日時"
        type="text"
        value={value ? value.toISOString() : ""}
        onChange={(e) =>
          onChange(e.target.value ? new Date(e.target.value) : null)
        }
      />
      {slotProps?.textField?.helperText && (
        <span>{slotProps.textField.helperText}</span>
      )}
    </div>
  ),
}));

const future = "2099-11-01T07:00:00.000Z";

const setup = (
  props: Partial<Parameters<typeof ScheduleInterviewDialog>[0]> = {},
) => {
  const onConfirm = vi.fn().mockResolvedValue(true);
  const onClose = vi.fn();
  render(
    <ScheduleInterviewDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
      error=""
      {...props}
    />,
  );
  return { onConfirm, onClose };
};

describe("ScheduleInterviewDialog", () => {
  it("予定日時を入力して確定すると onConfirm に日時を渡し、成功したら閉じる", async () => {
    const { onConfirm, onClose } = setup();

    fireEvent.change(screen.getByLabelText("予定日時"), {
      target: { value: future },
    });
    fireEvent.click(screen.getByRole("button", { name: "確定する" }));

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(new Date(future)),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("予定日時が未入力のときは送信せず、エラーを表示する", async () => {
    const { onConfirm } = setup();

    fireEvent.click(screen.getByRole("button", { name: "確定する" }));

    expect(
      await screen.findByText("予定日時を入力してください"),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("過去の日時は送信せず、エラーを表示する", async () => {
    const { onConfirm } = setup();

    fireEvent.change(screen.getByLabelText("予定日時"), {
      target: { value: "2020-01-01T00:00:00.000Z" },
    });
    fireEvent.click(screen.getByRole("button", { name: "確定する" }));

    expect(
      await screen.findByText("予定日時は現在より後の日時を指定してください"),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("失敗したときは閉じずにエラーを表示する", async () => {
    const onConfirm = vi.fn().mockResolvedValue(false);
    const { onClose } = setup({
      onConfirm,
      error:
        "他のユーザーによってデータが更新されています。再読み込みしてください",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "他のユーザーによってデータが更新されています",
    );

    fireEvent.change(screen.getByLabelText("予定日時"), {
      target: { value: future },
    });
    fireEvent.click(screen.getByRole("button", { name: "確定する" }));

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

    fireEvent.change(screen.getByLabelText("予定日時"), {
      target: { value: future },
    });
    fireEvent.click(screen.getByRole("button", { name: "確定する" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "確定する" })).toBeDisabled(),
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });
});
