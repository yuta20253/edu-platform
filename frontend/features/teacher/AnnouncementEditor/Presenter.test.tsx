import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { AnnouncementTargetOptions } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

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
        aria-label="配信日時"
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

const options: AnnouncementTargetOptions = {
  grades: [{ id: 1, year: 1, display_name: "1年" }],
  user_roles: [{ id: 1, name: "student" }],
  students: {
    items: [],
    meta: { current_page: 1, total_pages: 1, total_count: 0, per_page: 20 },
  },
  own_grade_restriction: null,
};

const defaultProps = {
  options,
  submitting: false,
  submitError: null,
  onSaveDraft: vi.fn(),
  onDeliver: vi.fn(),
};

describe("AnnouncementEditorPresenter", () => {
  it("タイトル・本文が空で表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("textbox", { name: "タイトル" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "本文" })).toHaveValue("");
  });

  it("配信先ピッカーが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("配信先")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "配信先の種類" }),
    ).toBeInTheDocument();
  });

  it("タイトル・本文が未入力のまま下書き保存すると必須エラーが表示されonSaveDraftは呼ばれない", async () => {
    const onSaveDraft = vi.fn();
    render(<Presenter {...defaultProps} onSaveDraft={onSaveDraft} />);

    fireEvent.click(screen.getByRole("button", { name: "下書き保存" }));

    expect(
      await screen.findByText("タイトルを入力してください"),
    ).toBeInTheDocument();
    expect(screen.getByText("本文を入力してください")).toBeInTheDocument();
    expect(onSaveDraft).not.toHaveBeenCalled();
  });

  it("本文が10,000字を超えるとエラーが表示される", async () => {
    render(<Presenter {...defaultProps} />);
    fireEvent.change(screen.getByRole("textbox", { name: "タイトル" }), {
      target: { value: "タイトル" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "本文" }), {
      target: { value: "あ".repeat(10_001) },
    });
    fireEvent.click(screen.getByRole("button", { name: "下書き保存" }));

    expect(
      await screen.findByText("本文は10000文字以内で入力してください"),
    ).toBeInTheDocument();
  });

  it("必須項目を入力して下書き保存するとonSaveDraftがdeliveryTiming: draftで呼ばれる", async () => {
    const onSaveDraft = vi.fn();
    render(<Presenter {...defaultProps} onSaveDraft={onSaveDraft} />);

    fireEvent.change(screen.getByRole("textbox", { name: "タイトル" }), {
      target: { value: "新しいお知らせ" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "本文" }), {
      target: { value: "本文です" },
    });
    fireEvent.click(screen.getByRole("button", { name: "下書き保存" }));

    await waitFor(() =>
      expect(onSaveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "新しいお知らせ",
          content: "本文です",
          deliveryTiming: "draft",
          targets: [{ target_type: "all_users" }],
        }),
      ),
    );
  });

  it("配信タイミングが下書き保存のままだと配信するボタンは無効", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("button", { name: "配信する" })).toBeDisabled();
  });

  it("即時公開を選択すると配信するボタンが有効になりonDeliverが呼ばれる", async () => {
    const onDeliver = vi.fn();
    render(<Presenter {...defaultProps} onDeliver={onDeliver} />);

    fireEvent.change(screen.getByRole("textbox", { name: "タイトル" }), {
      target: { value: "即時公開のお知らせ" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "本文" }), {
      target: { value: "本文です" },
    });
    fireEvent.click(screen.getByLabelText("即時公開"));

    const deliverButton = screen.getByRole("button", { name: "配信する" });
    expect(deliverButton).not.toBeDisabled();
    fireEvent.click(deliverButton);

    await waitFor(() =>
      expect(onDeliver).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "即時公開のお知らせ",
          content: "本文です",
          deliveryTiming: "immediate",
        }),
      ),
    );
  });

  it("予約投稿で日時未指定のまま配信するとエラーが表示されonDeliverは呼ばれない", async () => {
    const onDeliver = vi.fn();
    render(<Presenter {...defaultProps} onDeliver={onDeliver} />);

    fireEvent.change(screen.getByRole("textbox", { name: "タイトル" }), {
      target: { value: "予約投稿のお知らせ" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "本文" }), {
      target: { value: "本文です" },
    });
    fireEvent.click(screen.getByLabelText("予約投稿"));
    fireEvent.click(screen.getByRole("button", { name: "配信する" }));

    expect(
      await screen.findByText("投稿日時を指定してください"),
    ).toBeInTheDocument();
    expect(onDeliver).not.toHaveBeenCalled();
  });

  it("予約投稿で過去日時を指定すると未来日時エラーが表示される", async () => {
    const onDeliver = vi.fn();
    render(<Presenter {...defaultProps} onDeliver={onDeliver} />);

    fireEvent.change(screen.getByRole("textbox", { name: "タイトル" }), {
      target: { value: "予約投稿のお知らせ" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "本文" }), {
      target: { value: "本文です" },
    });
    fireEvent.click(screen.getByLabelText("予約投稿"));
    fireEvent.change(screen.getByLabelText("配信日時"), {
      target: { value: "2000-01-01T00:00:00.000Z" },
    });
    fireEvent.click(screen.getByRole("button", { name: "配信する" }));

    expect(
      await screen.findByText("未来の日時を指定してください"),
    ).toBeInTheDocument();
    expect(onDeliver).not.toHaveBeenCalled();
  });

  it("予約投稿で未来日時を指定して配信するとonDeliverがscheduledAt付きで呼ばれる", async () => {
    const onDeliver = vi.fn();
    render(<Presenter {...defaultProps} onDeliver={onDeliver} />);

    fireEvent.change(screen.getByRole("textbox", { name: "タイトル" }), {
      target: { value: "予約投稿のお知らせ" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "本文" }), {
      target: { value: "本文です" },
    });
    fireEvent.click(screen.getByLabelText("予約投稿"));
    fireEvent.change(screen.getByLabelText("配信日時"), {
      target: { value: "2099-01-01T00:00:00.000Z" },
    });
    fireEvent.click(screen.getByRole("button", { name: "配信する" }));

    await waitFor(() =>
      expect(onDeliver).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "予約投稿のお知らせ",
          content: "本文です",
          deliveryTiming: "scheduled",
          scheduledAt: new Date("2099-01-01T00:00:00.000Z"),
        }),
      ),
    );
  });

  it("submitErrorが渡されるとエラーメッセージが表示される", () => {
    render(
      <Presenter
        {...defaultProps}
        submitError="お知らせの作成に失敗しました"
      />,
    );
    expect(
      screen.getByText("お知らせの作成に失敗しました"),
    ).toBeInTheDocument();
  });

  it("「キャンセル」は一覧へのリンクになっている", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("link", { name: "キャンセル" })).toHaveAttribute(
      "href",
      "/teacher/announcements",
    );
  });
});
