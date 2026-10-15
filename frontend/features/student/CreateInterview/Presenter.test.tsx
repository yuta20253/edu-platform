import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Presenter } from "./Presenter";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const teachers = [
  { id: 1, name: "担任先生" },
  { id: 2, name: "数学先生" },
];

const selectOption = (comboboxName: string, optionName: string) => {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: comboboxName }));
  fireEvent.click(screen.getByRole("option", { name: optionName }));
};

describe("CreateInterviewPresenter", () => {
  it("見出しと入力項目、一覧へ戻るキャンセルリンクが表示される", () => {
    render(<Presenter teachers={teachers} onSubmit={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "面談を申請", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "先生" })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "相談カテゴリ" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("相談内容")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "キャンセル" })).toHaveAttribute(
      "href",
      "/interviews",
    );
  });

  it("先生の選択肢に教員一覧、相談カテゴリの選択肢にカテゴリ一覧が表示される", () => {
    render(<Presenter teachers={teachers} onSubmit={vi.fn()} />);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "先生" }));
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "担任先生",
      "数学先生",
    ]);
  });

  it("未入力で送信するとバリデーションエラーが表示され onSubmit は呼ばれない", async () => {
    const onSubmit = vi.fn();
    render(<Presenter teachers={teachers} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "申請する" }));

    expect(
      await screen.findByText("先生を選択してください"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("相談カテゴリを選択してください"),
    ).toBeInTheDocument();
    expect(screen.getByText("相談内容を入力してください")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("相談内容が2000文字を超えるとバリデーションエラーになる", async () => {
    const onSubmit = vi.fn();
    render(<Presenter teachers={teachers} onSubmit={onSubmit} />);
    selectOption("先生", "担任先生");
    selectOption("相談カテゴリ", "進路");
    fireEvent.change(screen.getByLabelText("相談内容"), {
      target: { value: "あ".repeat(2001) },
    });
    fireEvent.click(screen.getByRole("button", { name: "申請する" }));

    expect(
      await screen.findByText("相談内容は2000文字以内で入力してください"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("入力して送信すると教員ID・カテゴリ・相談内容で onSubmit が呼ばれる", async () => {
    const onSubmit = vi.fn();
    render(<Presenter teachers={teachers} onSubmit={onSubmit} />);
    selectOption("先生", "数学先生");
    selectOption("相談カテゴリ", "勉強方法");
    fireEvent.change(screen.getByLabelText("相談内容"), {
      target: { value: "数学の勉強方法を相談したい" },
    });
    fireEvent.click(screen.getByRole("button", { name: "申請する" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          teacher_id: 2,
          reason_category: "study_method",
          reason_detail: "数学の勉強方法を相談したい",
        },
        expect.anything(),
      ),
    );
  });

  it("submitError があればエラーとして表示する", () => {
    render(
      <Presenter
        teachers={teachers}
        onSubmit={vi.fn()}
        submitError="この教員との進行中の面談が既に存在します"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "この教員との進行中の面談が既に存在します",
    );
  });

  it("申請できる先生がいないときは案内を表示し、申請ボタンを無効にする", () => {
    render(<Presenter teachers={[]} onSubmit={vi.fn()} />);
    expect(
      screen.getByText(
        "申請できる先生がいません。所属する学級が登録されているか確認してください",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "申請する" })).toBeDisabled();
  });
});
