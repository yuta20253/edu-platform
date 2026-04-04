import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { AdminSchoolDetail } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockSchool: AdminSchoolDetail = {
  id: 1,
  name: "東京第一高校",
  prefecture_name: "東京都",
  student_count: 300,
  teacher_count: 20,
};

const defaultProps = {
  school: mockSchool,
};

describe("AdminSchoolDetailPresenter", () => {
  describe("パンくずナビ", () => {
    it("「高校一覧」リンクが /admin/schools を指している", () => {
      render(<Presenter {...defaultProps} />);
      const link = screen.getByRole("link", { name: "高校一覧" });
      expect(link).toHaveAttribute("href", "/admin/schools");
    });

    it("パンくずに高校名が表示される", () => {
      render(<Presenter {...defaultProps} />);
      // パンくずの高校名（現在地）はリンクなしのテキストとして存在する
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
    it("「概要」「教師管理」タブが表示される", () => {
      render(<Presenter {...defaultProps} />);
      expect(screen.getByRole("tab", { name: "概要" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "教師管理" })).toBeInTheDocument();
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
    it("タブ切り替え後に「最初の教師を追加する」ボタンが表示される", () => {
      render(<Presenter {...defaultProps} />);
      fireEvent.click(screen.getByRole("tab", { name: "教師管理" }));
      expect(
        screen.getByRole("button", { name: "最初の教師を追加する" }),
      ).toBeInTheDocument();
    });
  });
});
