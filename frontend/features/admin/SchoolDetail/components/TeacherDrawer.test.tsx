import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TeacherDrawer } from "./TeacherDrawer";
import type { Grade, Teacher } from "../types";

const grades: Grade[] = [
  { id: 1, name: "高１生" },
  { id: 2, name: "高２生" },
];

const baseProps = {
  open: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  submitting: false,
  submitErrors: [],
  grades,
};

describe("TeacherDrawer", () => {
  describe("新規追加モード", () => {
    it("姓/名・メール・初期パスワードの入力欄が表示される", () => {
      render(<TeacherDrawer {...baseProps} mode="create" />);
      expect(screen.getByRole("textbox", { name: "姓" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "名" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "メールアドレス" })).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: "初期パスワード" }),
      ).toBeInTheDocument();
    });

    it("「自動生成」ボタンをクリックするとパスワード欄が埋まる", () => {
      render(<TeacherDrawer {...baseProps} mode="create" />);
      const passwordInput = screen.getByRole("textbox", {
        name: "初期パスワード",
      }) as HTMLInputElement;
      expect(passwordInput.value).toBe("");

      fireEvent.click(screen.getByRole("button", { name: "自動生成" }));

      expect(passwordInput.value).not.toBe("");
      expect(passwordInput.value.length).toBeGreaterThanOrEqual(8);
    });

    it("担当学年権限が「全学年」のとき担当学年チェックボックスは無効化される", () => {
      render(<TeacherDrawer {...baseProps} mode="create" />);
      fireEvent.click(screen.getByRole("radio", { name: "全学年" }));
      expect(
        screen.getByRole("checkbox", { name: "高１生" }),
      ).toBeDisabled();
    });

    it("担当学年権限が「自学年」のとき担当学年チェックボックスは有効", () => {
      render(<TeacherDrawer {...baseProps} mode="create" />);
      expect(
        screen.getByRole("checkbox", { name: "高１生" }),
      ).toBeEnabled();
    });

    it("必須項目を入力して送信するとonSubmitへ結合前の値が渡される", async () => {
      const onSubmit = vi.fn();
      render(<TeacherDrawer {...baseProps} mode="create" onSubmit={onSubmit} />);

      fireEvent.change(screen.getByRole("textbox", { name: "姓" }), {
        target: { value: "田中" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: "名" }), {
        target: { value: "太郎" },
      });
      fireEvent.change(screen.getByRole("textbox", { name: "メールアドレス" }), {
        target: { value: "tanaka@example.com" },
      });
      fireEvent.change(
        screen.getByRole("textbox", { name: "初期パスワード" }),
        {
          target: { value: "abc123xyz" },
        },
      );
      fireEvent.click(screen.getByRole("checkbox", { name: "高１生" }));

      fireEvent.click(screen.getByRole("button", { name: "追加" }));

      await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          lastName: "田中",
          firstName: "太郎",
          email: "tanaka@example.com",
          password: "abc123xyz",
          gradeScope: "own_grade",
          manageOtherTeachers: false,
          gradeIds: [1],
        }),
        expect.anything(),
      );
    });

    it("必須項目が未入力だとonSubmitが呼ばれずエラーが表示される", async () => {
      const onSubmit = vi.fn();
      render(<TeacherDrawer {...baseProps} mode="create" onSubmit={onSubmit} />);

      fireEvent.click(screen.getByRole("button", { name: "追加" }));

      expect(
        await screen.findByText("姓を入力してください"),
      ).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("編集モード", () => {
    const teacher: Teacher = {
      id: 5,
      name: "田中 花子",
      email: "hanako@example.com",
      grade_scope: "all_grades",
      manage_other_teachers: true,
      grades: [{ id: 2, name: "高２生" }],
    };

    it("初期パスワード欄は表示されない", () => {
      render(
        <TeacherDrawer
          {...baseProps}
          mode="edit"
          initialTeacher={teacher}
        />,
      );
      expect(
        screen.queryByRole("textbox", { name: "初期パスワード" }),
      ).not.toBeInTheDocument();
    });

    it("既存の値がフォームにプリフィルされる", () => {
      render(
        <TeacherDrawer
          {...baseProps}
          mode="edit"
          initialTeacher={teacher}
        />,
      );
      expect(screen.getByRole("textbox", { name: "姓" })).toHaveValue("田中");
      expect(screen.getByRole("textbox", { name: "名" })).toHaveValue("花子");
      expect(screen.getByRole("textbox", { name: "メールアドレス" })).toHaveValue(
        "hanako@example.com",
      );
      expect(screen.getByRole("radio", { name: "全学年" })).toBeChecked();
      expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    });
  });

  describe("エラー表示", () => {
    it("submitErrorsがあるとアラートに表示される", () => {
      render(
        <TeacherDrawer
          {...baseProps}
          mode="create"
          submitErrors={["メールアドレスは既に使用されています"]}
        />,
      );
      expect(
        screen.getByText("メールアドレスは既に使用されています"),
      ).toBeInTheDocument();
    });
  });
});
