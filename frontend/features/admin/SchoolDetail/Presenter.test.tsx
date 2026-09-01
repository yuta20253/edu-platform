import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "@/libs/http/apiClient";
import { Presenter } from "./Presenter";
import type { SchoolDetail } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const routerMock = { push: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/libs/http/apiClient", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const mockSchool: SchoolDetail = {
  id: 1,
  name: "東京第一高校",
  prefecture_name: "東京都",
  student_count: 300,
  teacher_count: 20,
};

const defaultProps = {
  school: mockSchool,
};

describe("SchoolDetailPresenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 各タブが叩くエンドポイントは空データを返す既定値にしておく
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url.includes("/teachers"))
        return Promise.resolve({ data: { teachers: [] } });
      if (url.includes("/grades"))
        return Promise.resolve({ data: { grades: [] } });
      if (url.includes("/course_assignments"))
        return Promise.resolve({ data: { course_assignments: [] } });
      if (url.includes("/announcements"))
        return Promise.resolve({
          data: {
            announcements: [],
            meta: {
              current_page: 1,
              total_pages: 1,
              total_count: 0,
              per_page: 20,
            },
          },
        });
      if (url.includes("/api/admin/courses"))
        return Promise.resolve({
          data: {
            courses: [],
            meta: {
              current_page: 1,
              total_pages: 1,
              total_count: 0,
              per_page: 100,
            },
          },
        });
      return Promise.resolve({ data: {} });
    });
  });

  describe("パンくずナビ", () => {
    it("「高校一覧」リンクが /admin/schools を指している", () => {
      render(<Presenter {...defaultProps} />);
      const link = screen.getByRole("link", { name: "高校一覧" });
      expect(link).toHaveAttribute("href", "/admin/schools");
    });

    it("パンくずに高校名が表示される", () => {
      render(<Presenter {...defaultProps} />);
      const breadcrumbItems = screen.getAllByText("東京第一高校");
      expect(breadcrumbItems.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("ページタイトル", () => {
    it("高校名が見出しとして表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(
        screen.getByRole("heading", { name: "東京第一高校" }),
      ).toBeInTheDocument();
    });
  });

  describe("タブ", () => {
    it("5つのタブが表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByRole("tab", { name: "概要" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "教師管理" })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "学年・クラス" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "コース割当" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "お知らせ" })).toBeInTheDocument();
    });

    it("初期表示では「概要」タブが選択されている", () => {
      render(<Presenter {...defaultProps} />);
      const overviewTab = screen.getByRole("tab", { name: "概要" });
      expect(overviewTab).toHaveAttribute("aria-selected", "true");
    });

    it("「教師管理」タブをクリックすると選択状態が切り替わる", () => {
      render(<Presenter {...defaultProps} />);
      const teacherTab = screen.getByRole("tab", { name: "教師管理" });
      fireEvent.click(teacherTab);
      expect(teacherTab).toHaveAttribute("aria-selected", "true");
    });

    it("「学年・クラス」タブをクリックすると選択状態が切り替わる", () => {
      render(<Presenter {...defaultProps} />);
      const gradesTab = screen.getByRole("tab", { name: "学年・クラス" });
      fireEvent.click(gradesTab);
      expect(gradesTab).toHaveAttribute("aria-selected", "true");
    });

    it("「コース割当」タブをクリックすると選択状態が切り替わる", () => {
      render(<Presenter {...defaultProps} />);
      const courseTab = screen.getByRole("tab", { name: "コース割当" });
      fireEvent.click(courseTab);
      expect(courseTab).toHaveAttribute("aria-selected", "true");
    });

    it("「お知らせ」タブをクリックすると選択状態が切り替わる", () => {
      render(<Presenter {...defaultProps} />);
      const announcementsTab = screen.getByRole("tab", { name: "お知らせ" });
      fireEvent.click(announcementsTab);
      expect(announcementsTab).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("概要タブ", () => {
    it("生徒数が表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByText("300")).toBeInTheDocument();
    });

    it("教師数が表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByText("20")).toBeInTheDocument();
    });

    it("都道府県名が表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByText("東京都")).toBeInTheDocument();
    });
  });

  describe("教師管理タブ", () => {
    it("タブ切り替え後に「最初の教師を追加する」ボタンが表示される", async () => {
      render(<Presenter {...defaultProps} />);
      fireEvent.click(screen.getByRole("tab", { name: "教師管理" }));
      expect(
        await screen.findByRole("button", { name: "最初の教師を追加する" }),
      ).toBeInTheDocument();
    });
  });

  describe("学年・クラスタブ", () => {
    it("タブ切り替え後に空状態メッセージが表示される", async () => {
      render(<Presenter {...defaultProps} />);
      fireEvent.click(screen.getByRole("tab", { name: "学年・クラス" }));
      expect(
        await screen.findByText("学年が登録されていません"),
      ).toBeInTheDocument();
    });
  });

  describe("コース割当タブ", () => {
    it("タブ切り替え後に空状態メッセージが表示される", async () => {
      render(<Presenter {...defaultProps} />);
      fireEvent.click(screen.getByRole("tab", { name: "コース割当" }));
      expect(
        await screen.findByText("コースが割り当てられていません"),
      ).toBeInTheDocument();
    });
  });

  describe("お知らせタブ", () => {
    it("タブ切り替え後に空状態メッセージが表示される", async () => {
      render(<Presenter {...defaultProps} />);
      fireEvent.click(screen.getByRole("tab", { name: "お知らせ" }));
      expect(
        await screen.findByText("お知らせがありません"),
      ).toBeInTheDocument();
    });
  });
});
