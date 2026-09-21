import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Presenter } from "./Presenter";
import type { SchoolClassDetailType } from "./types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockSchoolClass: SchoolClassDetailType = {
  id: 10,
  name: "1組",
  grade: { id: 1, year: 1, display_name: "高校1年" },
  teachers: [
    { id: 100, name: "山田太郎", role: "homeroom" },
    { id: 101, name: "佐藤次郎", role: "assistant" },
  ],
  students: [
    { id: 200, name: "鈴木一郎", name_kana: "スズキイチロウ" },
    { id: 201, name: "田中花子", name_kana: "タナカハナコ" },
  ],
};

describe("SchoolClassDetailPresenter", () => {
  it("学年・クラス名が見出しに表示される", () => {
    render(<Presenter schoolClass={mockSchoolClass} />);
    expect(screen.getByText("高校1年 1組")).toBeInTheDocument();
  });

  it("担任・副担任がroleラベルつきで表示される", () => {
    render(<Presenter schoolClass={mockSchoolClass} />);
    expect(screen.getByText("山田太郎（担任）")).toBeInTheDocument();
    expect(screen.getByText("佐藤次郎（副担任）")).toBeInTheDocument();
  });

  it("担任・副担任がいない場合は「未設定」と表示される", () => {
    render(<Presenter schoolClass={{ ...mockSchoolClass, teachers: [] }} />);
    expect(screen.getByText("未設定")).toBeInTheDocument();
  });

  it("在籍生徒一覧が氏名・よみがなつきで表示される", () => {
    render(<Presenter schoolClass={mockSchoolClass} />);
    expect(screen.getByText("在籍生徒（2名）")).toBeInTheDocument();
    expect(screen.getByText("鈴木一郎")).toBeInTheDocument();
    expect(screen.getByText("スズキイチロウ")).toBeInTheDocument();
    expect(screen.getByText("田中花子")).toBeInTheDocument();
    expect(screen.getByText("タナカハナコ")).toBeInTheDocument();
  });

  it("生徒名が生徒詳細画面へのリンクになっている", () => {
    render(<Presenter schoolClass={mockSchoolClass} />);
    const link = screen.getByText("鈴木一郎").closest("a");
    expect(link).toHaveAttribute("href", "/teacher/students/200");
  });

  it("一覧へ戻るリンクが学級一覧を指している", () => {
    render(<Presenter schoolClass={mockSchoolClass} />);
    const link = screen.getByRole("link", { name: "一覧へ戻る" });
    expect(link).toHaveAttribute("href", "/teacher/school-classes");
  });
});
