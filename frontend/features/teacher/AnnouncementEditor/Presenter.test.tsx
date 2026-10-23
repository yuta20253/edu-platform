import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { AnnouncementEditData, AnnouncementTargetOptions } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// 「個人」の行の生徒検索はAPIを呼ぶため、検索結果が空の状態に固定する
vi.mock("./hooks/useStudentSearch", () => ({
  useStudentSearch: () => ({
    query: "",
    handleQueryChange: vi.fn(),
    page: 1,
    setPage: vi.fn(),
    students: null,
  }),
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
  editData: null,
  options,
  submitting: false,
  submitError: null,
  optionsError: null,
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

  it("タイトルが255字を超えるとエラーが表示される", async () => {
    const onSaveDraft = vi.fn();
    render(<Presenter {...defaultProps} onSaveDraft={onSaveDraft} />);
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
    expect(onSaveDraft).not.toHaveBeenCalled();
  });

  it("配信タイミングの下書きは「下書き保存」ボタンと区別できる文言で表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(
      screen.getByRole("radio", { name: "配信しない(下書き)" }),
    ).toBeChecked();
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

  describe("配信先の検証", () => {
    const fillRequired = () => {
      fireEvent.change(screen.getByRole("textbox", { name: "タイトル" }), {
        target: { value: "お知らせ" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: "本文" }), {
        target: { value: "本文です" },
      });
    };

    it("配信先をすべて削除して保存するとエラーが表示されonSaveDraftは呼ばれない", async () => {
      const onSaveDraft = vi.fn();
      render(<Presenter {...defaultProps} onSaveDraft={onSaveDraft} />);
      fillRequired();

      fireEvent.click(screen.getByRole("button", { name: "削除" }));
      fireEvent.click(screen.getByRole("button", { name: "下書き保存" }));

      expect(
        await screen.findByText("配信先を1つ以上指定してください"),
      ).toBeInTheDocument();
      expect(onSaveDraft).not.toHaveBeenCalled();
    });

    it("同じ配信先が重複しているとエラーが表示されonSaveDraftは呼ばれない", async () => {
      const onSaveDraft = vi.fn();
      render(<Presenter {...defaultProps} onSaveDraft={onSaveDraft} />);
      fillRequired();

      fireEvent.click(screen.getByRole("button", { name: "配信先を追加" }));
      fireEvent.click(screen.getByRole("button", { name: "下書き保存" }));

      expect(
        await screen.findByText("同じ配信先が重複しています"),
      ).toBeInTheDocument();
      expect(onSaveDraft).not.toHaveBeenCalled();
    });

    it("学年別で学年・権限が未選択だとエラーが表示されonSaveDraftは呼ばれない", async () => {
      const onSaveDraft = vi.fn();
      render(<Presenter {...defaultProps} onSaveDraft={onSaveDraft} />);
      fillRequired();

      fireEvent.mouseDown(
        screen.getByRole("combobox", { name: "配信先の種類" }),
      );
      fireEvent.click(screen.getByRole("option", { name: "学年別" }));
      fireEvent.click(screen.getByRole("button", { name: "下書き保存" }));

      expect(
        await screen.findByText("学年を選択してください"),
      ).toBeInTheDocument();
      expect(screen.getByText("権限を選択してください")).toBeInTheDocument();
      expect(onSaveDraft).not.toHaveBeenCalled();
    });
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

  it("配信先の選択肢を読み込むまでは保存・配信できない", () => {
    render(<Presenter {...defaultProps} options={null} />);
    fireEvent.click(screen.getByLabelText("即時公開"));

    expect(screen.getByRole("button", { name: "下書き保存" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "配信する" })).toBeDisabled();
  });

  it("配信先の選択肢の取得に失敗するとエラーが表示される", () => {
    render(
      <Presenter
        {...defaultProps}
        options={null}
        optionsError="配信先の取得に失敗しました"
      />,
    );

    expect(screen.getByText("配信先の取得に失敗しました")).toBeInTheDocument();
  });

  it("「キャンセル」は一覧へのリンクになっている", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByRole("link", { name: "キャンセル" })).toHaveAttribute(
      "href",
      "/teacher/announcements",
    );
  });

  describe("編集時", () => {
    const draftEditData: AnnouncementEditData = {
      announcement: {
        id: 9,
        title: "既存のお知らせ",
        content: "既存の本文",
        status: "draft",
        scheduled_at: null,
      },
      announcement_targets: [
        {
          id: 10,
          target_type: "by_grade",
          high_school_id: null,
          grade_id: 1,
          user_role_id: 1,
          user_id: null,
          user_name: null,
        },
        {
          id: 11,
          target_type: "all_users",
          high_school_id: 3,
          grade_id: null,
          user_role_id: null,
          user_id: null,
          user_name: null,
        },
      ],
    };

    it("新規作成時の見出しは「お知らせを作成」", () => {
      render(<Presenter {...defaultProps} />);
      expect(
        screen.getByRole("heading", { name: "お知らせを作成" }),
      ).toBeInTheDocument();
    });

    it("見出しが「お知らせを編集」になり、タイトル・本文が現在の値で表示される", () => {
      render(<Presenter {...defaultProps} editData={draftEditData} />);

      expect(
        screen.getByRole("heading", { name: "お知らせを編集" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "タイトル" })).toHaveValue(
        "既存のお知らせ",
      );
      expect(screen.getByRole("textbox", { name: "本文" })).toHaveValue(
        "既存の本文",
      );
      expect(
        screen.getByRole("radio", { name: "配信しない(下書き)" }),
      ).toBeChecked();
    });

    it("配信先が現在の値で表示される", () => {
      render(<Presenter {...defaultProps} editData={draftEditData} />);

      const targetTypes = screen.getAllByRole("combobox", {
        name: "配信先の種類",
      });
      expect(targetTypes).toHaveLength(2);
      expect(targetTypes[0]).toHaveTextContent("学年別");
      expect(targetTypes[1]).toHaveTextContent("全員");
      expect(screen.getByRole("combobox", { name: "学年" })).toHaveTextContent(
        "1年",
      );
      expect(screen.getByRole("combobox", { name: "権限" })).toHaveTextContent(
        "生徒",
      );
    });

    it("変更せずに保存すると、配信先は表示用の項目を除いた値で渡される", async () => {
      const onSaveDraft = vi.fn();
      render(
        <Presenter
          {...defaultProps}
          editData={draftEditData}
          onSaveDraft={onSaveDraft}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "下書き保存" }));

      await waitFor(() =>
        expect(onSaveDraft).toHaveBeenCalledWith({
          title: "既存のお知らせ",
          content: "既存の本文",
          targets: [
            { target_type: "by_grade", grade_id: 1, user_role_id: 1 },
            { target_type: "all_users" },
          ],
          deliveryTiming: "draft",
          scheduledAt: null,
        }),
      );
    });

    it("予約投稿は配信タイミングが予約投稿で、配信日時が現在の値で表示される", () => {
      render(
        <Presenter
          {...defaultProps}
          editData={{
            ...draftEditData,
            announcement: {
              ...draftEditData.announcement,
              status: "scheduled",
              scheduled_at: "2099-01-01T00:00:00.000Z",
            },
          }}
        />,
      );

      expect(screen.getByRole("radio", { name: "予約投稿" })).toBeChecked();
      expect(screen.getByLabelText("配信日時")).toHaveValue(
        "2099-01-01T00:00:00.000Z",
      );
    });

    it("選択済みの「個人」配信先は、生徒の検索結果に関係なくuser_nameで表示される", () => {
      render(
        <Presenter
          {...defaultProps}
          editData={{
            ...draftEditData,
            announcement_targets: [
              {
                id: 12,
                target_type: "by_user",
                high_school_id: null,
                grade_id: null,
                user_role_id: null,
                user_id: 5,
                user_name: "山田太郎",
              },
            ],
          }}
        />,
      );

      expect(screen.getByRole("combobox", { name: "生徒" })).toHaveTextContent(
        "山田太郎",
      );
    });
  
    it("予約投稿の編集では、下書きの配信タイミングと「下書き保存」ボタンを選べない", () => {
      render(
        <Presenter
          {...defaultProps}
          editData={{
            ...draftEditData,
            announcement: {
              ...draftEditData.announcement,
              status: "scheduled",
              scheduled_at: "2099-01-01T00:00:00.000Z",
            },
          }}
        />,
      );

      expect(
        screen.queryByRole("radio", { name: "配信しない(下書き)" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "下書き保存" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "即時公開" })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "予約投稿" })).toBeInTheDocument();
    });

    it("下書きの編集では、下書きの配信タイミングと「下書き保存」ボタンを選べる", () => {
      render(<Presenter {...defaultProps} editData={draftEditData} />);

      expect(
        screen.getByRole("radio", { name: "配信しない(下書き)" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "下書き保存" }),
      ).toBeInTheDocument();
    });
  });
});
