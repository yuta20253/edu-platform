import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ComponentProps } from "react";
import { Presenter } from "./Presenter";
import type { Student, StudentGoal, StudentGoalsData } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockStudent: Student = {
  id: 1,
  name: "山田太郎",
  name_kana: "ヤマダタロウ",
  email: "yamada@example.com",
  profile_completed: true,
  user_personal_info: {
    id: 10,
    phone_number: "09012345678",
    birthday: "2008-04-01",
    gender: "male",
  },
  high_school: { name: "東京第一高校" },
  address: {
    id: 5,
    postal_code: "1000001",
    city: "千代田区",
    town: "千代田",
    prefecture: { id: 13, name: "東京都" },
  },
  grade: { year: 1, display_name: "高校1年" },
};

const mockGoalsData: StudentGoalsData = {
  student: { id: 1, name: "山田太郎" },
  goals: [],
};

const mockGoal: StudentGoal = {
  id: 1,
  title: "英検2級に合格する",
  description: "12月の試験で合格する",
  status: "in_progress",
  due_date: "2026/12/31",
  progress: {
    task_completed_count: 2,
    task_total_count: 5,
    completion_rate: 40.0,
  },
  tasks: [],
};

type Props = ComponentProps<typeof Presenter>;

const renderPresenter = (props: Partial<Props> = {}) => {
  const defaultProps: Props = {
    tab: "profile",
    data: { tab: "profile", data: mockStudent },
    loading: false,
    error: false,
    page: 1,
    onTabChange: vi.fn(),
    onPageChange: vi.fn(),
  };
  return render(<Presenter {...defaultProps} {...props} />);
};

const renderProfile = (student: Student) =>
  renderPresenter({ data: { tab: "profile", data: student } });

const renderGoals = (goals: StudentGoal[]) =>
  renderPresenter({
    tab: "goals",
    data: { tab: "goals", data: { ...mockGoalsData, goals } },
  });

describe("StudentDetailPresenter", () => {
  describe("ヘッダーとタブ", () => {
    it("プロフィール・目標・タスクの3つのタブが表示され、選択中のタブが選ばれている", () => {
      renderPresenter();
      expect(screen.getByRole("tab", { name: "プロフィール" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByRole("tab", { name: "目標" })).toHaveAttribute(
        "aria-selected",
        "false",
      );
      expect(screen.getByRole("tab", { name: "タスク" })).toBeInTheDocument();
    });

    it("タブをクリックするとonTabChangeがそのタブで呼ばれる", async () => {
      const onTabChange = vi.fn();
      renderPresenter({ onTabChange });

      await userEvent.click(screen.getByRole("tab", { name: "タスク" }));

      expect(onTabChange).toHaveBeenCalledWith("tasks");
    });

    it("目標タブのデータでもヘッダーに生徒名が表示される", () => {
      renderPresenter({
        tab: "goals",
        data: { tab: "goals", data: mockGoalsData },
      });
      expect(screen.getByText("生徒詳細")).toBeInTheDocument();
      expect(screen.getByText("山田太郎")).toBeInTheDocument();
    });

    it("「一覧へ戻る」リンクが /teacher/students を指している", () => {
      renderPresenter();
      expect(screen.getByRole("link", { name: "一覧へ戻る" })).toHaveAttribute(
        "href",
        "/teacher/students",
      );
    });
  });

  describe("タブ切り替え中・失敗時", () => {
    it("読み込み中はヘッダーとタブを残したままローディングを表示する", () => {
      renderPresenter({ tab: "goals", loading: true });
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.getByText("山田太郎")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "一覧へ戻る" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "目標" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.queryByText("yamada@example.com")).not.toBeInTheDocument();
    });

    it("選択中のタブとデータのタブが食い違う間は、前のタブの内容を出さずローディングを表示する", () => {
      renderPresenter({ tab: "goals" });
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.queryByText("yamada@example.com")).not.toBeInTheDocument();
    });

    it("取得に失敗したときはヘッダーを残したままエラーを表示する", () => {
      renderPresenter({ tab: "tasks", error: true });
      expect(
        screen.getByText("データの取得に失敗しました"),
      ).toBeInTheDocument();
      expect(screen.getByText("山田太郎")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "一覧へ戻る" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });
  });

  describe("プロフィールタブ", () => {
    it("基本情報が表示される", () => {
      renderPresenter();
      expect(screen.getByText("ヤマダタロウ")).toBeInTheDocument();
      expect(screen.getByText("yamada@example.com")).toBeInTheDocument();
      expect(screen.getByText("高校1年")).toBeInTheDocument();
      expect(screen.getByText("東京第一高校")).toBeInTheDocument();
    });

    it("氏名がヘッダーとプロフィールの両方に表示される", () => {
      renderPresenter();
      expect(screen.getAllByText("山田太郎")).toHaveLength(2);
    });

    it("プロフィール完了時は「入力完了」バッジが表示される", () => {
      renderPresenter();
      expect(screen.getByText("入力完了")).toBeInTheDocument();
    });

    it("プロフィール未完了時は「未完了」バッジが表示される", () => {
      renderProfile({ ...mockStudent, profile_completed: false });
      expect(screen.getByText("未完了")).toBeInTheDocument();
    });

    it("個人情報（生年月日・性別・電話番号・住所）が表示される", () => {
      renderPresenter();
      expect(screen.getByText("2008-04-01")).toBeInTheDocument();
      expect(screen.getByText("男性")).toBeInTheDocument();
      expect(screen.getByText("09012345678")).toBeInTheDocument();
      expect(
        screen.getByText("〒1000001 東京都千代田区千代田"),
      ).toBeInTheDocument();
    });

    it("性別が female のとき「女性」と表示される", () => {
      renderProfile({
        ...mockStudent,
        user_personal_info: {
          ...mockStudent.user_personal_info!,
          gender: "female",
        },
      });
      expect(screen.getByText("女性")).toBeInTheDocument();
    });

    it("user_personal_info が未設定のとき生年月日・電話番号・性別が「未設定」になる", () => {
      renderProfile({ ...mockStudent, user_personal_info: undefined });
      expect(screen.getAllByText("未設定").length).toBeGreaterThanOrEqual(2);
    });

    it("address が未設定のとき住所が「未設定」になる", () => {
      renderProfile({ ...mockStudent, address: undefined });
      expect(screen.getByText("未設定")).toBeInTheDocument();
    });
  });

  describe("目標タブ", () => {
    it("目標のタイトル・ステータス・期限が表示される", () => {
      renderGoals([mockGoal]);
      expect(screen.getByText("英検2級に合格する")).toBeInTheDocument();
      expect(screen.getByText("進行中")).toBeInTheDocument();
      expect(screen.getByText("期限: 2026/12/31")).toBeInTheDocument();
    });

    it("期限が未設定のときは「期限なし」と表示される", () => {
      renderGoals([{ ...mockGoal, due_date: null }]);
      expect(screen.getByText("期限なし")).toBeInTheDocument();
    });

    it("タスクの完了数/総数と完了率の進捗バーが表示される", () => {
      renderGoals([mockGoal]);
      expect(screen.getByText("タスク完了 2/5")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "40",
      );
    });

    it("目標が0件のときは空である旨が表示される", () => {
      renderGoals([]);
      expect(screen.getByText("目標がありません")).toBeInTheDocument();
    });
  });
});
