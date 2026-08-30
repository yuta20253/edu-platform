import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import { usePermissionForm } from "./hooks/usePermissionForm";
import type {
  PermissionTeacher,
  SnackbarState,
  TeacherPermissionsData,
} from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const currentUser: TeacherPermissionsData["current_user"] = {
  id: 1,
  name: "山田太郎",
  name_kana: "ヤマダタロウ",
  grade: { year: 1, display_name: "1年" },
  invitation_status: "sent",
  teacher_permission: {
    id: 1,
    grade_scope: "all_grades",
    manage_other_teachers: true,
  },
};

const teachers: PermissionTeacher[] = [
  {
    id: 1,
    name: "山田太郎",
    teacher_permission: {
      id: 1,
      grade_scope: "all_grades",
      manage_other_teachers: true,
    },
  },
  {
    id: 2,
    name: "鈴木花子",
    teacher_permission: {
      id: 2,
      grade_scope: "own_grade",
      manage_other_teachers: false,
    },
  },
];

const mockData: TeacherPermissionsData = {
  current_user: currentUser,
  teachers,
  meta: { current_page: 1, total_pages: 1, total_count: 2, per_page: 20 },
};

const defaultSnackbar: SnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

function TestPresenter(
  overrides: Partial<React.ComponentProps<typeof Presenter>> = {},
) {
  const form = usePermissionForm();
  const defaultProps: React.ComponentProps<typeof Presenter> = {
    data: mockData,
    page: 1,
    onPageChange: vi.fn(),
    editingTeacher: null,
    onEditClick: vi.fn(),
    onDrawerClose: vi.fn(),
    onUpdate: vi.fn(),
    updating: false,
    updateErrors: [],
    snackbar: defaultSnackbar,
    onSnackbarClose: vi.fn(),
    form,
  };
  return <Presenter {...defaultProps} {...overrides} />;
}

describe("TeacherPermissionsPresenter", () => {
  it("見出しと件数が表示される", () => {
    render(<TestPresenter />);
    expect(screen.getByText("教員権限管理")).toBeInTheDocument();
    expect(screen.getByText("2件")).toBeInTheDocument();
  });

  it("テーブルヘッダーに「氏名」「操作範囲」「他職員権限」「編集」が表示される", () => {
    render(<TestPresenter />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toContain("氏名");
    expect(headers).toContain("操作範囲");
    expect(headers).toContain("他職員権限");
    expect(headers).toContain("編集");
  });

  it("teachers が行として正しくレンダリングされる", () => {
    render(<TestPresenter />);
    expect(screen.getByText("全学年")).toBeInTheDocument();
    expect(screen.getByText("自学年")).toBeInTheDocument();
    expect(screen.getByText("有")).toBeInTheDocument();
    expect(screen.getByText("無")).toBeInTheDocument();
  });

  it("自分の行に「（自分）」と表示される", () => {
    render(<TestPresenter />);
    const row = screen.getByText("山田太郎").closest("tr")!;
    expect(within(row).getByText("（自分）")).toBeInTheDocument();
  });

  it("「教員一覧へ戻る」リンクが /teacher/colleagues を指している", () => {
    render(<TestPresenter />);
    expect(
      screen.getByRole("link", { name: "教員一覧へ戻る" }),
    ).toHaveAttribute("href", "/teacher/colleagues");
  });

  it("manage_other_teachers が true のとき警告が表示されず、自分以外の編集ボタンが有効", () => {
    render(<TestPresenter />);
    expect(
      screen.queryByText("権限を編集するには「他の教員操作権限」が必要です。"),
    ).not.toBeInTheDocument();

    const suzukiRow = screen.getByText("鈴木花子").closest("tr")!;
    expect(
      within(suzukiRow).getByRole("button", { name: "編集" }),
    ).toBeEnabled();
  });

  it("自分自身の行の編集ボタンは常に無効", () => {
    render(<TestPresenter />);
    const yamadaRow = screen.getByText("山田太郎").closest("tr")!;
    expect(
      within(yamadaRow).getByRole("button", { name: "編集" }),
    ).toBeDisabled();
  });

  it("manage_other_teachers が false のとき警告が表示され、編集ボタンが無効化される", () => {
    render(
      <TestPresenter
        data={{
          ...mockData,
          current_user: {
            ...currentUser,
            teacher_permission: {
              ...currentUser.teacher_permission,
              manage_other_teachers: false,
            },
          },
        }}
      />,
    );
    expect(
      screen.getByText("権限を編集するには「他の教員操作権限」が必要です。"),
    ).toBeInTheDocument();
    const suzukiRow = screen.getByText("鈴木花子").closest("tr")!;
    expect(
      within(suzukiRow).getByRole("button", { name: "編集" }),
    ).toBeDisabled();
  });

  it("編集ボタンをクリックすると onEditClick が対象の教員データで呼ばれる", () => {
    const onEditClick = vi.fn();
    render(<TestPresenter onEditClick={onEditClick} />);
    const suzukiRow = screen.getByText("鈴木花子").closest("tr")!;
    fireEvent.click(within(suzukiRow).getByRole("button", { name: "編集" }));
    expect(onEditClick).toHaveBeenCalledWith(teachers[1]);
  });

  it("editingTeacher が null のとき編集ドロワーの内容は表示されない", () => {
    render(<TestPresenter editingTeacher={null} />);
    expect(screen.queryByText("権限を編集")).not.toBeInTheDocument();
  });

  it("editingTeacher が設定されると編集ドロワーが対象教員名で表示される", () => {
    render(<TestPresenter editingTeacher={teachers[1]} />);
    expect(screen.getByText("権限を編集")).toBeInTheDocument();
    expect(screen.getAllByText("鈴木花子").length).toBeGreaterThan(0);
  });

  it("編集ドロワーで値を変更して保存すると onUpdate が編集値で呼ばれる", async () => {
    const onUpdate = vi.fn();
    render(<TestPresenter editingTeacher={teachers[1]} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByRole("radio", { name: "全学年" }));
    fireEvent.click(screen.getByRole("radio", { name: "有" }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        {
          grade_scope: "all_grades",
          manage_other_teachers: true,
        },
        expect.anything(),
      );
    });
  });

  it("キャンセルボタンで onDrawerClose が呼ばれる", () => {
    const onDrawerClose = vi.fn();
    render(
      <TestPresenter
        editingTeacher={teachers[1]}
        onDrawerClose={onDrawerClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onDrawerClose).toHaveBeenCalledTimes(1);
  });

  it("updateErrors がドロワー内にエラー表示される", () => {
    render(
      <TestPresenter
        editingTeacher={teachers[1]}
        updateErrors={["権限の更新に失敗しました"]}
      />,
    );
    expect(screen.getByText("権限の更新に失敗しました")).toBeInTheDocument();
  });

  it("updating 中は保存・キャンセルボタンが無効", () => {
    render(<TestPresenter editingTeacher={teachers[1]} updating />);
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "キャンセル" })).toBeDisabled();
  });

  it("snackbar.open のときメッセージが表示される", () => {
    render(
      <TestPresenter
        snackbar={{
          open: true,
          message: "権限を更新しました",
          severity: "success",
        }}
      />,
    );
    expect(screen.getByText("権限を更新しました")).toBeInTheDocument();
  });

  it("total_pages が1のときページネーションが表示されない", () => {
    render(<TestPresenter />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("total_pages が複数あるときページネーションが表示され、クリックで onPageChange が呼ばれる", () => {
    const onPageChange = vi.fn();
    render(
      <TestPresenter
        data={{
          ...mockData,
          meta: { ...mockData.meta, total_pages: 3 },
        }}
        page={1}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
