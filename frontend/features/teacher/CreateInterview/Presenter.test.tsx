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

const students = [
  { id: 1, name: "山田太郎" },
  { id: 2, name: "佐藤花子" },
];

const selectStudent = (keyword: string, optionName: string) => {
  const input = screen.getByRole("combobox", { name: "生徒" });
  fireEvent.change(input, { target: { value: keyword } });
  fireEvent.click(screen.getByRole("option", { name: optionName }));
};

describe("teacher/CreateInterview Presenter", () => {
  it("見出しと入力項目、一覧へ戻るキャンセルリンクを表示する", () => {
    render(<Presenter students={students} onSubmit={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "面談を申請", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "生徒" })).toBeInTheDocument();
    expect(screen.getByLabelText("相談内容")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "キャンセル" })).toHaveAttribute(
      "href",
      "/teacher/interviews",
    );
  });

  it("生徒名の一部を入力すると候補が絞り込まれる", () => {
    render(<Presenter students={students} onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: "生徒" }), {
      target: { value: "佐藤" },
    });

    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "佐藤花子",
    ]);
  });

  it("未入力で送信するとバリデーションエラーを表示し onSubmit は呼ばない", async () => {
    const onSubmit = vi.fn();
    render(<Presenter students={students} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "申請する" }));

    expect(
      await screen.findByText("生徒を選択してください"),
    ).toBeInTheDocument();
    expect(screen.getByText("相談内容を入力してください")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("相談内容が2000文字を超えるとバリデーションエラーになる", async () => {
    const onSubmit = vi.fn();
    render(<Presenter students={students} onSubmit={onSubmit} />);
    selectStudent("山田", "山田太郎");
    fireEvent.change(screen.getByLabelText("相談内容"), {
      target: { value: "あ".repeat(2001) },
    });

    fireEvent.click(screen.getByRole("button", { name: "申請する" }));

    expect(
      await screen.findByText("相談内容は2000文字以内で入力してください"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("生徒と相談内容を入力して送信すると、生徒の id と相談内容で onSubmit を呼ぶ", async () => {
    const onSubmit = vi.fn();
    render(<Presenter students={students} onSubmit={onSubmit} />);
    selectStudent("佐藤", "佐藤花子");
    fireEvent.change(screen.getByLabelText("相談内容"), {
      target: { value: "最近の成績について話したい" },
    });

    fireEvent.click(screen.getByRole("button", { name: "申請する" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { student_id: 2, reason_detail: "最近の成績について話したい" },
        expect.anything(),
      ),
    );
  });

  it("initialStudentId が候補にあれば、その生徒を選択した状態で表示する", async () => {
    const onSubmit = vi.fn();
    render(
      <Presenter
        students={students}
        initialStudentId={1}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole("combobox", { name: "生徒" })).toHaveValue(
      "山田太郎",
    );

    fireEvent.change(screen.getByLabelText("相談内容"), {
      target: { value: "面談したい" },
    });
    fireEvent.click(screen.getByRole("button", { name: "申請する" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { student_id: 1, reason_detail: "面談したい" },
        expect.anything(),
      ),
    );
  });

  it("initialStudentId が候補に無いときは未選択で表示する", () => {
    render(
      <Presenter
        students={students}
        initialStudentId={999}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "生徒" })).toHaveValue("");
  });

  it("申請できる生徒がいないときは案内を表示し、送信できない", () => {
    render(<Presenter students={[]} onSubmit={vi.fn()} />);

    expect(
      screen.getByText(
        "申請できる生徒がいません。担当する生徒が登録されているか確認してください",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "申請する" })).toBeDisabled();
  });

  it("送信エラーがあれば表示する", () => {
    render(
      <Presenter
        students={students}
        onSubmit={vi.fn()}
        submitError="この生徒との進行中の面談が既に存在します"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "この生徒との進行中の面談が既に存在します",
    );
  });
});
