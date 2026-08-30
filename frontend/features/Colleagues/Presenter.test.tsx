import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import { useCreateTeacherForm } from "./hooks/useCreateTeacherForm";
import type { GradeOption, Teacher, TeachersData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const currentUser: Teacher = {
  id: 1,
  name: "現在の教員",
  name_kana: "ゲンザイノキョウイン",
  grade: { year: 1, display_name: "1年" },
  teacher_permission: {
    id: 1,
    grade_scope: "all_grades",
    manage_other_teachers: true,
  },
  invitation_status: "sent",
};

const teachers: Teacher[] = [
  {
    id: 2,
    name: "山田太郎",
    name_kana: "ヤマダタロウ",
    grade: { year: 1, display_name: "1年A組" },
    teacher_permission: {
      id: 2,
      grade_scope: "own_grade",
      manage_other_teachers: false,
    },
    invitation_status: "pending",
  },
  {
    id: 3,
    name: "鈴木花子",
    name_kana: "スズキハナコ",
    grade: { year: 2, display_name: "2年B組" },
    teacher_permission: {
      id: 3,
      grade_scope: "all_grades",
      manage_other_teachers: true,
    },
    invitation_status: "failed",
  },
];

const mockData: TeachersData = {
  current_user: currentUser,
  teachers,
  meta: {
    current_page: 1,
    total_pages: 3,
    total_count: 30,
    per_page: 10,
  },
};

const mockGradeOptions: GradeOption[] = [
  { id: 10, year: 1, display_name: "1年A組" },
];

type PresenterOverrides = Partial<React.ComponentProps<typeof Presenter>>;

const TestWrapper = (overrides: PresenterOverrides) => {
  const form = useCreateTeacherForm();

  return (
    <Presenter
      data={mockData}
      page={1}
      onPageChange={vi.fn()}
      drawerOpen={false}
      onAddClick={vi.fn()}
      onDrawerClose={vi.fn()}
      onCreate={vi.fn()}
      creating={false}
      createErrors={[]}
      snackbar={{ open: false, message: "", severity: "success" }}
      onSnackbarClose={vi.fn()}
      gradeOptions={mockGradeOptions}
      form={form}
      {...overrides}
    />
  );
};

describe("ColleaguesPresenter", () => {
  it("見出しと件数が表示される", () => {
    render(<TestWrapper />);
    expect(screen.getByText("教員一覧")).toBeInTheDocument();
    expect(screen.getByText("30件")).toBeInTheDocument();
  });

  it("manage_other_teachers が true のとき操作ボタンが表示される", () => {
    render(<TestWrapper />);
    expect(
      screen.getByRole("link", { name: "権限管理" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "未招待者一覧" }),
    ).toBeInTheDocument();
    expect(screen.getByText("新規登録")).toBeInTheDocument();
  });

  it("manage_other_teachers が false のとき操作ボタンが表示されない", () => {
    render(
      <TestWrapper
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
      screen.queryByRole("link", { name: "権限管理" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "未招待者一覧" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("新規登録")).not.toBeInTheDocument();
  });

  it("「新規登録」ボタンで onAddClick が呼ばれる", () => {
    const onAddClick = vi.fn();
    render(<TestWrapper onAddClick={onAddClick} />);
    fireEvent.click(screen.getByText("新規登録"));
    expect(onAddClick).toHaveBeenCalledTimes(1);
  });

  it("テーブルヘッダーが表示される", () => {
    render(<TestWrapper />);
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual([
      "氏名",
      "氏名カナ",
      "担当学年",
      "操作範囲",
      "他職員権限",
      "送信状況",
      "詳細",
    ]);
  });

  it("teachers データが行として正しくレンダリングされる", () => {
    render(<TestWrapper />);
    expect(screen.getByText("山田太郎")).toBeInTheDocument();
    expect(screen.getByText("ヤマダタロウ")).toBeInTheDocument();
    expect(screen.getByText("1年A組")).toBeInTheDocument();
    expect(screen.getByText("鈴木花子")).toBeInTheDocument();
    expect(screen.getByText("2年B組")).toBeInTheDocument();

    expect(screen.getByText("自学年")).toBeInTheDocument();
    expect(screen.getAllByText("全学年").length).toBeGreaterThan(0);
    expect(screen.getByText("未送信")).toBeInTheDocument();
    expect(screen.getByText("送信失敗")).toBeInTheDocument();
  });

  it("「詳細」リンクが /teacher/colleagues/[id] を指している", () => {
    render(<TestWrapper />);
    const detailLinks = screen.getAllByRole("link", { name: "詳細" });
    expect(detailLinks[0]).toHaveAttribute("href", "/teacher/colleagues/2");
    expect(detailLinks[1]).toHaveAttribute("href", "/teacher/colleagues/3");
  });

  it("total_pages が1より大きいときページネーションが表示され、操作すると onPageChange が呼ばれる", () => {
    const onPageChange = vi.fn();
    render(<TestWrapper onPageChange={onPageChange} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("total_pages が1のときページネーションが表示されない", () => {
    render(
      <TestWrapper
        data={{ ...mockData, meta: { ...mockData.meta, total_pages: 1 } }}
      />,
    );
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("snackbar.open のときメッセージが表示される", () => {
    render(
      <TestWrapper
        snackbar={{
          open: true,
          message: "教員を追加しました",
          severity: "success",
        }}
      />,
    );
    expect(screen.getByText("教員を追加しました")).toBeInTheDocument();
  });

  it("drawerOpen のとき教員追加フォームが表示される", () => {
    render(<TestWrapper drawerOpen />);
    expect(screen.getByText("教員を追加")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "氏名" }),
    ).toBeInTheDocument();
  });

  it("フォームに入力して送信すると onCreate が正しい値で呼ばれる", async () => {
    const onCreate = vi.fn();
    render(<TestWrapper drawerOpen onCreate={onCreate} />);

    fireEvent.change(screen.getByRole("textbox", { name: "氏名" }), {
      target: { value: "山田太郎" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "氏名(カナ)" }), {
      target: { value: "ヤマダタロウ" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "メールアドレス" }), {
      target: { value: "yamada@example.com" },
    });

    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "1年A組" }));

    fireEvent.click(screen.getByRole("button", { name: "追加" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "山田太郎",
          name_kana: "ヤマダタロウ",
          email: "yamada@example.com",
          grade_id: 10,
          grade_scope: "own_grade",
          manage_other_teachers: false,
        }),
        expect.anything(),
      );
    });
  });

  it("必須項目が未入力のまま追加ボタンを押しても onCreate は呼ばれない", () => {
    const onCreate = vi.fn();
    render(<TestWrapper drawerOpen onCreate={onCreate} />);

    fireEvent.click(screen.getByRole("button", { name: "追加" }));

    expect(onCreate).not.toHaveBeenCalled();
  });

  it("createErrors が Alert で表示される", () => {
    render(
      <TestWrapper
        drawerOpen
        createErrors={["メールアドレスは既に使用されています"]}
      />,
    );
    expect(
      screen.getByText("メールアドレスは既に使用されています"),
    ).toBeInTheDocument();
  });

  it("creating 中は追加ボタンとキャンセルボタンが無効", () => {
    render(<TestWrapper drawerOpen creating />);
    expect(screen.getByRole("button", { name: "追加" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "キャンセル" }),
    ).toBeDisabled();
  });

  it("「キャンセル」ボタンで onDrawerClose が呼ばれる", () => {
    const onDrawerClose = vi.fn();
    render(<TestWrapper drawerOpen onDrawerClose={onDrawerClose} />);
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onDrawerClose).toHaveBeenCalledTimes(1);
  });
});
