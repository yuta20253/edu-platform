import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { UnsentTeacher } from "./types";

const mockTeachers: UnsentTeacher[] = [
  { id: 1, name: "山田太郎", name_kana: "ヤマダタロウ", email: "yamada@example.com" },
  { id: 2, name: "鈴木花子", name_kana: "スズキハナコ", email: "suzuki@example.com" },
];

const defaultProps = {
  teachers: mockTeachers,
  loading: false,
  error: null as string | null,
  selectedTeacherIds: [] as number[],
  submitting: false,
  submitError: null as string | null,
  successMessage: null as string | null,
  allSelected: false,
  onToggleTeacher: vi.fn(),
  onToggleAll: vi.fn(),
  onSendInvites: vi.fn(),
};

describe("ColleagueInvitationPresenter", () => {
  it("見出しとテーブルヘッダーが表示される", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("未招待教員一覧")).toBeInTheDocument();
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual(["", "氏名", "氏名カナ", "メール"]);
  });

  it("teachers データが行として正しくレンダリングされる", () => {
    render(<Presenter {...defaultProps} />);
    expect(screen.getByText("山田太郎")).toBeInTheDocument();
    expect(screen.getByText("ヤマダタロウ")).toBeInTheDocument();
    expect(screen.getByText("yamada@example.com")).toBeInTheDocument();
    expect(screen.getByText("鈴木花子")).toBeInTheDocument();
    expect(screen.getByText("suzuki@example.com")).toBeInTheDocument();
  });

  it("loading のときローディング表示になる", () => {
    render(<Presenter {...defaultProps} loading />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("山田太郎")).not.toBeInTheDocument();
  });

  it("error があるときエラーメッセージが表示される", () => {
    render(
      <Presenter
        {...defaultProps}
        error="未招待の教員一覧の取得に失敗しました。ページを再読み込みしてください。"
      />,
    );
    expect(
      screen.getByText(
        "未招待の教員一覧の取得に失敗しました。ページを再読み込みしてください。",
      ),
    ).toBeInTheDocument();
  });

  it("teachers が空のとき空状態メッセージが表示される", () => {
    render(<Presenter {...defaultProps} teachers={[]} />);
    expect(
      screen.getByText("現在、未招待の教員はいません。"),
    ).toBeInTheDocument();
  });

  it("行のチェックボックスをクリックすると onToggleTeacher が呼ばれる", () => {
    const onToggleTeacher = vi.fn();
    render(
      <Presenter {...defaultProps} onToggleTeacher={onToggleTeacher} />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    expect(onToggleTeacher).toHaveBeenCalledWith(1);
  });

  it("ヘッダーのチェックボックスをクリックすると onToggleAll が呼ばれる", () => {
    const onToggleAll = vi.fn();
    render(<Presenter {...defaultProps} onToggleAll={onToggleAll} />);
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onToggleAll).toHaveBeenCalledTimes(1);
  });

  it("selectedTeacherIds に含まれる行のチェックボックスがチェックされる", () => {
    render(<Presenter {...defaultProps} selectedTeacherIds={[2]} />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it("allSelected のときヘッダーのチェックボックスがチェックされる", () => {
    render(<Presenter {...defaultProps} allSelected />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
  });

  it("選択中は0件のときボタンが無効", () => {
    render(<Presenter {...defaultProps} selectedTeacherIds={[]} />);
    expect(
      screen.getByRole("button", { name: "選択した教員に招待を送信" }),
    ).toBeDisabled();
  });

  it("選択があるときボタンが有効になり、クリックで onSendInvites が呼ばれる", () => {
    const onSendInvites = vi.fn();
    render(
      <Presenter
        {...defaultProps}
        selectedTeacherIds={[1]}
        onSendInvites={onSendInvites}
      />,
    );
    const button = screen.getByRole("button", {
      name: "選択した教員に招待を送信",
    });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onSendInvites).toHaveBeenCalledTimes(1);
  });

  it("submitting 中はボタンが「送信中...」表示になり無効化される", () => {
    render(
      <Presenter {...defaultProps} selectedTeacherIds={[1]} submitting />,
    );
    expect(
      screen.getByRole("button", { name: "送信中..." }),
    ).toBeDisabled();
  });

  it("submitError が表示される", () => {
    render(
      <Presenter
        {...defaultProps}
        submitError="招待送信に失敗しました。もう一度お試しください。"
      />,
    );
    expect(
      screen.getByText("招待送信に失敗しました。もう一度お試しください。"),
    ).toBeInTheDocument();
  });

  it("successMessage が表示される", () => {
    render(
      <Presenter {...defaultProps} successMessage="招待の送信を開始しました。" />,
    );
    expect(
      screen.getByText("招待の送信を開始しました。"),
    ).toBeInTheDocument();
  });
});
