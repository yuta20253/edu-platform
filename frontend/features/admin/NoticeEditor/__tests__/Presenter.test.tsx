import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "../Presenter";
import type { AdminNoticeDetail } from "@/types/announcement/admin-notice";

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

const publisher = { id: 1, name: "管理者太郎", name_kana: "カンリシャタロウ" };

const draftNotice: AdminNoticeDetail = {
  id: 1,
  title: "既存のお知らせ",
  content: "既存の本文",
  status: "draft",
  target_type: "all_users",
  published_at: null,
  scheduled_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  publisher,
};

const scheduledNotice: AdminNoticeDetail = {
  ...draftNotice,
  id: 2,
  status: "scheduled",
  scheduled_at: "2099-02-01T09:00:00.000Z",
};

const defaultProps = {
  notice: null,
  submitting: false,
  submitError: null,
  onSaveDraft: vi.fn(),
  onDeliver: vi.fn(),
};

describe("NoticeEditorPresenter", () => {
  it("新規作成時はタイトル・本文が空で表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("textbox", { name: "タイトル" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "本文" })).toHaveValue("");
    expect(screen.getByText("お知らせを作成")).toBeInTheDocument();
  });

  it("編集時は既存のタイトル・本文が表示される", () => {
    render(<Presenter {...defaultProps} notice={draftNotice} />);
    expect(screen.getByRole("textbox", { name: "タイトル" })).toHaveValue(
      "既存のお知らせ",
    );
    expect(screen.getByRole("textbox", { name: "本文" })).toHaveValue(
      "既存の本文",
    );
    expect(screen.getByText("お知らせを編集")).toBeInTheDocument();
  });

  it("予約配信のお知らせを編集すると配信日時が入力済みで表示される", () => {
    render(<Presenter {...defaultProps} notice={scheduledNotice} />);
    expect(screen.getByLabelText("配信日時")).toHaveValue(
      "2099-02-01T09:00:00.000Z",
    );
  });

  it("配信対象は常に「全ユーザー」固定で表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("全ユーザー")).toBeInTheDocument();
    expect(
      screen.getByText("特定の高校・学年への配信は教師機能で行います"),
    ).toBeInTheDocument();
  });

  it("本文を入力するとプレビューに改行を保持して表示され、HTMLはエスケープされる", () => {
    render(<Presenter {...defaultProps} />);
    fireEvent.change(screen.getByRole("textbox", { name: "本文" }), {
      target: { value: "1行目\n<script>alert(1)</script>" },
    });

    const preview = screen.getByTestId("notice-preview");
    expect(preview).toHaveStyle({ whiteSpace: "pre-wrap" });
    expect(preview.textContent).toBe("1行目\n<script>alert(1)</script>");
    expect(preview.querySelector("script")).toBeNull();
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

  it("タイトルが255文字を超えるとエラーが表示される", async () => {
    render(<Presenter {...defaultProps} />);
    fireEvent.change(screen.getByRole("textbox", { name: "タイトル" }), {
      target: { value: "あ".repeat(256) },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "本文" }), {
      target: { value: "本文" },
    });
    fireEvent.click(screen.getByRole("button", { name: "下書き保存" }));

    expect(
      await screen.findByText("タイトルは255文字以内で入力してください"),
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
        }),
      ),
    );
  });

  it("配信タイミングが下書き保存のままだと配信するボタンは無効", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("button", { name: "配信する" })).toBeDisabled();
  });

  it("即時配信を選択すると配信するボタンが有効になりonDeliverが呼ばれる", async () => {
    const onDeliver = vi.fn();
    render(<Presenter {...defaultProps} onDeliver={onDeliver} />);

    fireEvent.change(screen.getByRole("textbox", { name: "タイトル" }), {
      target: { value: "即時配信のお知らせ" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "本文" }), {
      target: { value: "本文です" },
    });
    fireEvent.click(screen.getByLabelText("即時配信"));

    const deliverButton = screen.getByRole("button", { name: "配信する" });
    expect(deliverButton).not.toBeDisabled();
    fireEvent.click(deliverButton);

    await waitFor(() =>
      expect(onDeliver).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "即時配信のお知らせ",
          content: "本文です",
          deliveryTiming: "immediate",
        }),
      ),
    );
  });

  it("予約配信で日時未指定のまま配信するとエラーが表示されonDeliverは呼ばれない", async () => {
    const onDeliver = vi.fn();
    render(<Presenter {...defaultProps} onDeliver={onDeliver} />);

    fireEvent.change(screen.getByRole("textbox", { name: "タイトル" }), {
      target: { value: "予約配信のお知らせ" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "本文" }), {
      target: { value: "本文です" },
    });
    fireEvent.click(screen.getByLabelText("予約配信"));
    fireEvent.click(screen.getByRole("button", { name: "配信する" }));

    expect(
      await screen.findByText("配信日時を指定してください"),
    ).toBeInTheDocument();
    expect(onDeliver).not.toHaveBeenCalled();
  });

  it("予約配信で過去日時を指定すると未来日時エラーが表示される", async () => {
    const onDeliver = vi.fn();
    render(<Presenter {...defaultProps} onDeliver={onDeliver} />);

    fireEvent.change(screen.getByRole("textbox", { name: "タイトル" }), {
      target: { value: "予約配信のお知らせ" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "本文" }), {
      target: { value: "本文です" },
    });
    fireEvent.click(screen.getByLabelText("予約配信"));
    fireEvent.change(screen.getByLabelText("配信日時"), {
      target: { value: "2000-01-01T00:00:00.000Z" },
    });
    fireEvent.click(screen.getByRole("button", { name: "配信する" }));

    expect(
      await screen.findByText("未来の日時を指定してください"),
    ).toBeInTheDocument();
    expect(onDeliver).not.toHaveBeenCalled();
  });

  it("予約配信で未来日時を指定して配信するとonDeliverがscheduledAt付きで呼ばれる", async () => {
    const onDeliver = vi.fn();
    render(<Presenter {...defaultProps} onDeliver={onDeliver} />);

    fireEvent.change(screen.getByRole("textbox", { name: "タイトル" }), {
      target: { value: "予約配信のお知らせ" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "本文" }), {
      target: { value: "本文です" },
    });
    fireEvent.click(screen.getByLabelText("予約配信"));
    fireEvent.change(screen.getByLabelText("配信日時"), {
      target: { value: "2099-01-01T00:00:00.000Z" },
    });
    fireEvent.click(screen.getByRole("button", { name: "配信する" }));

    await waitFor(() =>
      expect(onDeliver).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "予約配信のお知らせ",
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
        submitError="お知らせの配信に失敗しました"
      />,
    );
    expect(
      screen.getByText("お知らせの配信に失敗しました"),
    ).toBeInTheDocument();
  });

  it("「キャンセル」は一覧へのリンクになっている", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("link", { name: "キャンセル" })).toHaveAttribute(
      "href",
      "/admin/notices",
    );
  });
});
