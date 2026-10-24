import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
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

const studentOptions = [
  { id: 1, name: "山田太郎" },
  { id: 2, name: "佐藤花子" },
];

const renderPresenter = (props: Partial<ComponentProps<typeof Presenter>>) =>
  render(
    <Presenter
      studentOptions={studentOptions}
      searching={false}
      searchError={false}
      onKeywordChange={vi.fn()}
      onSubmit={vi.fn()}
      {...props}
    />,
  );

const typeStudent = (keyword: string) => {
  const input = screen.getByRole("combobox", { name: "生徒" });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: keyword } });
};

const selectStudent = (keyword: string, optionName: string) => {
  typeStudent(keyword);
  fireEvent.click(screen.getByRole("option", { name: optionName }));
};

describe("teacher/CreateInterview Presenter", () => {
  it("見出しと入力項目、一覧へ戻るキャンセルリンクを表示する", () => {
    renderPresenter({});

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

  it("生徒名を入力すると onKeywordChange を呼び、検索結果をそのまま候補に出す", () => {
    const onKeywordChange = vi.fn();
    renderPresenter({ onKeywordChange });

    typeStudent("佐藤");

    expect(onKeywordChange).toHaveBeenLastCalledWith("佐藤");
    // 絞り込みはサーバーで行うため、入力と一致しない候補も消さない
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "山田太郎",
      "佐藤花子",
    ]);
  });

  it("候補を選んでも、選んだ名前で検索し直さない", () => {
    const onKeywordChange = vi.fn();
    renderPresenter({ onKeywordChange });

    selectStudent("佐藤", "佐藤花子");

    expect(onKeywordChange).not.toHaveBeenCalledWith("佐藤花子");
  });

  it("検索中は検索中の表示を出す", () => {
    renderPresenter({ studentOptions: [], searching: true });

    typeStudent("山田");

    expect(screen.getByText("検索中…")).toBeInTheDocument();
  });

  it("該当する生徒がいないときはその旨を表示する", () => {
    renderPresenter({ studentOptions: [] });

    typeStudent("存在しない");

    expect(screen.getByText("該当する生徒がいません")).toBeInTheDocument();
  });

  it("検索に失敗したときは失敗した旨を表示する", () => {
    renderPresenter({ studentOptions: [], searchError: true });

    typeStudent("山田");

    expect(screen.getByText("生徒の取得に失敗しました")).toBeInTheDocument();
  });

  it("未入力で送信するとバリデーションエラーを表示し onSubmit は呼ばない", async () => {
    const onSubmit = vi.fn();
    renderPresenter({ onSubmit });

    fireEvent.click(screen.getByRole("button", { name: "申請する" }));

    expect(
      await screen.findByText("生徒を選択してください"),
    ).toBeInTheDocument();
    expect(screen.getByText("相談内容を入力してください")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("相談内容が2000文字を超えるとバリデーションエラーになる", async () => {
    const onSubmit = vi.fn();
    renderPresenter({ onSubmit });
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
    renderPresenter({ onSubmit });
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

  it("initialStudent が検索結果に無くても、その生徒を選択した状態で送信できる", async () => {
    const onSubmit = vi.fn();
    renderPresenter({
      initialStudent: { id: 150, name: "鈴木一郎" },
      onSubmit,
    });

    expect(screen.getByRole("combobox", { name: "生徒" })).toHaveValue(
      "鈴木一郎",
    );

    fireEvent.change(screen.getByLabelText("相談内容"), {
      target: { value: "面談したい" },
    });
    fireEvent.click(screen.getByRole("button", { name: "申請する" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { student_id: 150, reason_detail: "面談したい" },
        expect.anything(),
      ),
    );
  });

  it("送信エラーがあれば表示する", () => {
    renderPresenter({
      submitError: "この生徒との進行中の面談が既に存在します",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "この生徒との進行中の面談が既に存在します",
    );
  });
});
