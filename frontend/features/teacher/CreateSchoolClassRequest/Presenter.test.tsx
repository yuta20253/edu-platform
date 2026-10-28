import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { GradeOption } from "./types";

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

const grades: GradeOption[] = [
  {
    id: 1,
    year: 1,
    display_name: "1年",
    school_classes: [
      { id: 11, name: "1年A組" },
      { id: 12, name: "1年B組" },
    ],
  },
  {
    id: 2,
    year: 2,
    display_name: "2年",
    school_classes: [{ id: 21, name: "2年A組" }],
  },
];

const renderPresenter = (
  props: Partial<ComponentProps<typeof Presenter>> = {},
) => render(<Presenter grades={grades} onSubmit={vi.fn()} {...props} />);

const chooseAction = (label: string) =>
  fireEvent.click(screen.getByRole("radio", { name: label }));

const selectOption = (comboboxName: string, optionName: string) => {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: comboboxName }));
  fireEvent.click(screen.getByRole("option", { name: optionName }));
};

const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: "申請する" }));

describe("teacher/CreateSchoolClassRequest Presenter", () => {
  it("見出しと入力項目、一覧へ戻るキャンセルリンクを表示する", () => {
    renderPresenter();

    expect(
      screen.getByRole("heading", { name: "学級を申請", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "新設" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "改名" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "削除" })).not.toBeChecked();
    expect(screen.getByRole("combobox", { name: "学年" })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "クラス名" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "キャンセル" })).toHaveAttribute(
      "href",
      "/teacher/school-class-requests",
    );
  });

  it("新設は対象クラスを選ばず、学年とクラス名で申請する", async () => {
    const onSubmit = vi.fn();
    renderPresenter({ onSubmit });

    expect(
      screen.queryByRole("combobox", { name: "対象クラス" }),
    ).not.toBeInTheDocument();
    selectOption("学年", "1年");
    fireEvent.change(screen.getByRole("textbox", { name: "クラス名" }), {
      target: { value: "1年F組" },
    });
    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      action: "creation",
      grade_id: 1,
      name: "1年F組",
    });
  });

  it("改名は対象クラスと新しいクラス名で申請する", async () => {
    const onSubmit = vi.fn();
    renderPresenter({ onSubmit });

    chooseAction("改名");
    selectOption("学年", "1年");
    selectOption("対象クラス", "1年B組");
    fireEvent.change(screen.getByRole("textbox", { name: "新しいクラス名" }), {
      target: { value: "1年E組" },
    });
    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      action: "modification",
      grade_id: 1,
      school_class_id: 12,
      name: "1年E組",
    });
  });

  it("削除はクラス名を入力せず、対象クラスだけで申請する", async () => {
    const onSubmit = vi.fn();
    renderPresenter({ onSubmit });

    chooseAction("削除");
    expect(
      screen.queryByRole("textbox", { name: /クラス名/ }),
    ).not.toBeInTheDocument();
    selectOption("学年", "2年");
    selectOption("対象クラス", "2年A組");
    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      action: "deletion",
      grade_id: 2,
      school_class_id: 21,
    });
  });

  it("削除を選ぶと、所属者がいるクラスは削除できないことを案内する", () => {
    renderPresenter();

    chooseAction("削除");

    expect(
      screen.getByText("生徒または教員が所属しているクラスは削除できません。"),
    ).toBeInTheDocument();
  });

  it("学年を選ぶまで対象クラスは選べず、選ぶとその学年のクラスだけが候補になる", () => {
    renderPresenter();

    chooseAction("改名");
    expect(
      screen.getByRole("combobox", { name: "対象クラス" }),
    ).toHaveAttribute("aria-disabled", "true");

    selectOption("学年", "1年");
    fireEvent.mouseDown(screen.getByRole("combobox", { name: "対象クラス" }));

    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "1年A組",
      "1年B組",
    ]);
  });

  it("学年を変えると対象クラスの選択を外す", async () => {
    const onSubmit = vi.fn();
    renderPresenter({ onSubmit });

    chooseAction("削除");
    selectOption("学年", "1年");
    selectOption("対象クラス", "1年A組");
    selectOption("学年", "2年");
    submit();

    expect(
      await screen.findByText("対象クラスを選択してください"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("未入力で送信すると項目ごとのエラーを出し、送信しない", async () => {
    const onSubmit = vi.fn();
    renderPresenter({ onSubmit });

    chooseAction("改名");
    submit();

    expect(
      await screen.findByText("学年を選択してください"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("対象クラスを選択してください"),
    ).toBeInTheDocument();
    expect(screen.getByText("クラス名を入力してください")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("クラス名が255文字を超えるとエラーを出し、送信しない", async () => {
    const onSubmit = vi.fn();
    renderPresenter({ onSubmit });

    selectOption("学年", "1年");
    fireEvent.change(screen.getByRole("textbox", { name: "クラス名" }), {
      target: { value: "あ".repeat(256) },
    });
    submit();

    expect(
      await screen.findByText("クラス名は255文字以内で入力してください"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("クラス名が空白だけのときは未入力のエラーを出し、送信しない", async () => {
    const onSubmit = vi.fn();
    renderPresenter({ onSubmit });

    selectOption("学年", "1年");
    fireEvent.change(screen.getByRole("textbox", { name: "クラス名" }), {
      target: { value: " 　" },
    });
    submit();

    expect(
      await screen.findByText("クラス名を入力してください"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("新設でクラス名が空のまま削除に切り替えても、クラス名のエラーで止めずに申請する", async () => {
    const onSubmit = vi.fn();
    renderPresenter({ onSubmit });

    submit();
    expect(
      await screen.findByText("クラス名を入力してください"),
    ).toBeInTheDocument();

    chooseAction("削除");
    selectOption("学年", "1年");
    selectOption("対象クラス", "1年A組");
    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it("送信エラーがあれば表示する", () => {
    renderPresenter({
      submitError: "School classに対して承認待ちの申請が既に存在します",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "School classに対して承認待ちの申請が既に存在します",
    );
  });
});
